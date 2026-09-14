import html
import io
import json
import os
import random
import re
import zipfile
import xml.etree.ElementTree as ET

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the local React dev server to call this API

OPENTDB_QUIZ_URL = "https://opentdb.com/api.php"
OPENTDB_CATEGORY_URL = "https://opentdb.com/api_category.php"


def extract_file_text(upload):
    filename = (upload.filename or "").lower()
    content = upload.read()
    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError:
            return "\n".join(re.findall(r"\(([^()]*)\)", content.decode("latin-1", errors="ignore")))
    if filename.endswith(".docx"):
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            document_xml = archive.read("word/document.xml")
        root = ET.fromstring(document_xml)
        namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        return "\n".join(node.text for node in root.iter(f"{namespace}t") if node.text)
    raise ValueError(f"Unsupported file type: {upload.filename}")


def build_study_plan(text, filenames):
    lines = [re.sub(r"\s+", " ", line).strip(" -•\t") for line in text.splitlines()]
    lines = [line for line in lines if line]
    topics = []
    for line in lines:
        words = line.split()
        if 1 < len(words) <= 8 and len(line) <= 80 and not line.endswith((".", ",", ";")):
            normalized = line.strip(":")
            if normalized.lower() not in {topic.lower() for topic in topics}:
                topics.append(normalized)
        if len(topics) == 8:
            break
    if not topics:
        topics = [
            sentence.strip()[:70]
            for sentence in re.split(r"[.!?]", text)
            if len(sentence.strip().split()) >= 3
        ][:8]
    if not topics:
        raise ValueError("The file text did not contain identifiable topics.")

    topic_details = [
        {
            "name": topic,
            "context": next((line for line in lines if topic.lower() in line.lower()), "Extracted from the uploaded material."),
        }
        for topic in topics
    ]

    quiz = []
    for index, topic in enumerate(topics[:8]):
        distractors = [item for item in topics if item != topic][:3]
        while len(distractors) < 3:
            distractors.append(f"Not covered in the uploaded file ({len(distractors) + 1})")
        options = distractors[:3] + [topic]
        random.shuffle(options)
        quiz.append({
            "id": index + 1,
            "question": "Which topic is covered in the uploaded material?",
            "topic": topic,
            "options": options,
            "correctAnswer": topic,
        })

    daily_tasks = [
        {
            "id": index + 1,
            "time": ["8:00 AM", "11:00 AM", "4:00 PM", "7:30 PM"][index % 4],
            "subject": "Uploaded material",
            "task": f"Study {topic}",
            "done": False,
        }
        for index, topic in enumerate(topics[:4])
    ]
    assignments = [
        {
            "id": index + 1,
            "title": f"{topic} review and practice",
            "subject": "Uploaded material",
            "due": f"Day {index + 1}",
            "status": "pending",
        }
        for index, topic in enumerate(topics[:4])
    ]
    return {
        "files": filenames,
        "summary": " ".join(lines)[:240],
        "content": text[:20000],
        "topics": topics,
        "topicDetails": topic_details,
        "dailyTasks": daily_tasks,
        "assignments": assignments,
        "quiz": quiz,
    }


def generate_daily_test(content, topics, daily_tasks, assignments):
    selected_topics = [str(topic).strip() for topic in topics if str(topic).strip()][:4]
    if not selected_topics:
        selected_topics = [str(task.get("task", "Uploaded material")) for task in daily_tasks[:4]]
    prompt = {
        "topics": selected_topics,
        "daily_tasks": daily_tasks[:4],
        "assignments": assignments[:4],
        "content": content[:12000],
    }
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": "Create a daily study MCQ test only from the supplied uploaded content and today's topics. Return JSON with a questions array. Each question must have id, topic, question, options (exactly 4 strings), and correctAnswer. Make questions test understanding, not topic recognition."},
                        {"role": "user", "content": json.dumps(prompt)},
                    ],
                },
                timeout=30,
            )
            response.raise_for_status()
            questions = response.json()["choices"][0]["message"]["content"]
            questions = json.loads(questions).get("questions", [])
            if questions:
                return questions[:8], "ai"
        except (requests.RequestException, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            app.logger.warning("AI test generation unavailable: %s", exc)

    questions = []
    for index, topic in enumerate(selected_topics):
        alternatives = [item for item in selected_topics if item != topic][:3]
        alternatives += [f"A different topic from the file {number}" for number in range(1, 4 - len(alternatives))]
        questions.append({
            "id": index + 1,
            "topic": topic,
            "question": f"Which topic should you study in today's task: {topic}?",
            "options": [topic, *alternatives[:3]],
            "correctAnswer": topic,
        })
    return questions, "local"


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/categories")
def categories():
    try:
        resp = requests.get(OPENTDB_CATEGORY_URL, timeout=8)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not reach the trivia source: {exc}"}), 502

    return jsonify(data.get("trivia_categories", []))


@app.route("/api/quiz")
def quiz():
    amount = request.args.get("amount", default=5, type=int)
    amount = max(1, min(amount, 20))
    category = request.args.get("category", type=str)
    difficulty = request.args.get("difficulty", type=str)

    params = {"amount": amount, "type": "multiple"}
    if category:
        params["category"] = category
    if difficulty in ("easy", "medium", "hard"):
        params["difficulty"] = difficulty

    try:
        resp = requests.get(OPENTDB_QUIZ_URL, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not reach the trivia source: {exc}"}), 502

    if data.get("response_code") != 0:
        return jsonify({
            "error": "The trivia source had no questions for those filters. Try different settings."
        }), 502

    questions = []
    for i, item in enumerate(data["results"]):
        question_text = html.unescape(item["question"])
        correct = html.unescape(item["correct_answer"])
        incorrect = [html.unescape(a) for a in item["incorrect_answers"]]

        options = incorrect + [correct]
        random.shuffle(options)

        questions.append({
            "id": i,
            "question": question_text,
            "options": options,
            "correctAnswer": correct,
            "category": html.unescape(item.get("category", "")),
            "difficulty": item.get("difficulty", ""),
        })

    return jsonify({"questions": questions})


@app.route("/api/analyze", methods=["POST"])
def analyze_files():
    uploads = [upload for upload in request.files.getlist("files") if upload.filename]
    if not uploads:
        return jsonify({"error": "Upload at least one PDF, Word document, or text file."}), 400

    extracted = []
    filenames = []
    try:
        for upload in uploads:
            extracted.append(extract_file_text(upload))
            filenames.append(upload.filename)
    except (ValueError, OSError) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Could not read the uploaded files: {exc}"}), 422

    text = "\n".join(part for part in extracted if part.strip())
    if not text.strip():
        return jsonify({"error": "The uploaded files did not contain readable text."}), 422
    try:
        return jsonify(build_study_plan(text, filenames))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422


@app.route("/api/generate-test", methods=["POST"])
def generate_test():
    payload = request.get_json(silent=True) or {}
    content = str(payload.get("content", "")).strip()
    topics = payload.get("topics", [])
    daily_tasks = payload.get("dailyTasks", [])
    assignments = payload.get("assignments", [])
    if not isinstance(topics, list) or not topics:
        return jsonify({"error": "An uploaded study plan with topics is required."}), 400
    if not content:
        content = "Uploaded study plan topics: " + ", ".join(str(topic) for topic in topics)
    questions, source = generate_daily_test(content, topics, daily_tasks, assignments)
    return jsonify({"questions": questions, "source": source})


@app.route("/api/study-chat", methods=["POST"])
def study_chat():
    payload = request.get_json(silent=True) or {}
    topic = str(payload.get("topic", "")).strip()
    context = str(payload.get("context", "")).strip()
    message = str(payload.get("message", "")).strip()
    if not topic or not message:
        return jsonify({"error": "A topic and question are required."}), 400

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "temperature": 0.3,
                    "messages": [
                        {"role": "system", "content": "You are a patient study tutor. Explain clearly, use the supplied material, and do not invent facts outside it without saying so."},
                        {"role": "user", "content": f"Topic: {topic}\nUploaded material: {context[:6000]}\nStudent question: {message}"},
                    ],
                },
                timeout=20,
            )
            response.raise_for_status()
            answer = response.json()["choices"][0]["message"]["content"].strip()
            return jsonify({"answer": answer, "source": "ai"})
        except (requests.RequestException, KeyError, IndexError, TypeError) as exc:
            app.logger.warning("AI study chat unavailable: %s", exc)

    return jsonify({
        "answer": f"Let's study {topic}. Based on your uploaded material: {context[:700]}\n\nTry this: explain the idea in your own words, list one example, and identify one part you would like clarified next.",
        "source": "local",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
