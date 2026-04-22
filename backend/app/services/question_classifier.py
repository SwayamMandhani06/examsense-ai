from app.ai.llm import generate_answer


def classify_question(question_text: str):
    """
    Uses LLM to classify:
    - topic
    - unit
    - difficulty
    """

    prompt = f"""
    Analyze the following exam question and return:

    1. Topic name (short)
    2. Unit (Unit 1, Unit 2, etc.)
    3. Difficulty level (easy, medium, hard)

    Question:
    {question_text}

    Return output strictly in JSON format:
    {{
        "topic": "...",
        "unit": "...",
        "difficulty": "easy|medium|hard"
    }}
    """

    response = generate_answer(prompt)

    try:
        import json
        parsed = json.loads(response)
        return parsed
    except:
        return {
            "topic": "General",
            "unit": "Unit 1",
            "difficulty": "medium"
        }
