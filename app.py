"""
AI Student OS - Quiz backend

Serves real, freshly-fetched multiple-choice questions (pulled live from the
Open Trivia DB, https://opentdb.com) instead of a static/hardcoded question
bank. No API key required.

Run locally:
    pip install -r requirements.txt
    python app.py

The server listens on http://localhost:5000
"""

import html
import random

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the local React dev server to call this API

OPENTDB_QUIZ_URL = "https://opentdb.com/api.php"
OPENTDB_CATEGORY_URL = "https://opentdb.com/api_category.php"


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
