from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from datetime import datetime

# ==============================
# RECENCY SCORE CALCULATION
# ==============================
def calculate_recency_score(last_year: int):
    current_year = datetime.now().year
    gap = current_year - last_year

    if gap == 0:
        return 1.0
    elif gap == 1:
        return 0.8
    elif gap == 2:
        return 0.6
    else:
        return 0.3

# ==============================
# HYBRID TOPIC RANKING
# ==============================
def get_topic_hybrid_ranking(db: Session, subject_id: int):

    topics = db.query(
        models.QuestionAnalytics.topic,
        func.count(models.QuestionAnalytics.id).label("frequency"),
        func.max(models.QuestionAnalytics.last_appeared_year).label("last_year")
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.topic
    ).all()

    if not topics:
        return []

    max_frequency = max(t.frequency for t in topics)

    results = []

    for topic, frequency, last_year in topics:

        normalized_freq = frequency / max_frequency if max_frequency > 0 else 0
        recency_score = calculate_recency_score(last_year)

        hybrid_score = round(
            (0.6 * normalized_freq) +
            (0.4 * recency_score),
            3
        )

        results.append({
            "topic": topic,
            "frequency": frequency,
            "recency_score": recency_score,
            "hybrid_score": hybrid_score
        })

    return sorted(results, key=lambda x: x["hybrid_score"], reverse=True)

# ==============================
# AVERAGE DIFFICULTY SCORE
# ==============================
def get_average_difficulty_score(db: Session, subject_id: int):

    difficulties = db.query(
        models.QuestionAnalytics.difficulty,
        func.count(models.QuestionAnalytics.id)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.difficulty
    ).all()

    weights = {
        "easy": 1,
        "medium": 2,
        "hard": 3
    }

    total_weight = 0
    total_count = 0

    for difficulty, count in difficulties:
        if difficulty in weights:
            total_weight += weights[difficulty] * count
            total_count += count

    if total_count == 0:
        return 0

    return round(total_weight / total_count, 2)

# ==============================
# SMART REVISION RECOMMENDATION
# ==============================
def get_revision_recommendation(db: Session, subject_id: int):

    topics = db.query(
        models.QuestionAnalytics.unit,
        models.QuestionAnalytics.topic,
        func.count(models.QuestionAnalytics.id).label("frequency"),
        func.max(models.QuestionAnalytics.last_appeared_year).label("last_year")
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.unit,
        models.QuestionAnalytics.topic
    ).all()

    if not topics:
        return []

    max_frequency = max(t.frequency for t in topics)

    unit_scores = {}

    for unit, topic, frequency, last_year in topics:

        normalized_freq = frequency / max_frequency if max_frequency > 0 else 0
        recency_score = calculate_recency_score(last_year)

        hybrid_score = (0.6 * normalized_freq) + (0.4 * recency_score)

        if unit not in unit_scores:
            unit_scores[unit] = 0

        unit_scores[unit] += hybrid_score

    total_score = sum(unit_scores.values())

    results = []

    for unit, score in unit_scores.items():

        percentage = round((score / total_score) * 100, 2) if total_score > 0 else 0

        results.append({
            "unit": unit,
            "recommended_focus_percentage": percentage
        })

    return sorted(results, key=lambda x: x["recommended_focus_percentage"], reverse=True)




def get_dashboard_overview(db: Session, subject_id: int):
    total_questions = db.query(models.QuestionAnalytics).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).count()

    most_topic = db.query(
        models.QuestionAnalytics.topic,
        func.count(models.QuestionAnalytics.topic)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.topic
    ).order_by(
        func.count(models.QuestionAnalytics.topic).desc()
    ).first()

    dominant_unit = db.query(
        models.QuestionAnalytics.unit,
        func.count(models.QuestionAnalytics.unit)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.unit
    ).order_by(
        func.count(models.QuestionAnalytics.unit).desc()
    ).first()

    return {
        "total_questions": total_questions,
        "most_asked_topic": most_topic[0] if most_topic else None,
        "dominant_unit": dominant_unit[0] if dominant_unit else None
    }


def get_topic_heatmap(db: Session, subject_id: int):
    topics = db.query(
        models.QuestionAnalytics.topic,
        func.count(models.QuestionAnalytics.topic)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.topic
    ).all()

    return [
        {"topic": topic, "frequency": count}
        for topic, count in topics
    ]


def get_difficulty_distribution(db: Session, subject_id: int):
    difficulties = db.query(
        models.QuestionAnalytics.difficulty,
        func.count(models.QuestionAnalytics.difficulty)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.difficulty
    ).all()

    result = {"easy": 0, "medium": 0, "hard": 0}

    for difficulty, count in difficulties:
        if difficulty:
            result[difficulty] = count

    return result


def get_unit_coverage(db: Session, subject_id: int):
    units = db.query(
        models.QuestionAnalytics.unit,
        func.count(models.QuestionAnalytics.unit)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.unit
    ).all()

    total = sum(count for _, count in units)

    return [
        {
            "unit": unit,
            "percentage": round((count / total) * 100, 2) if total else 0
        }
        for unit, count in units
    ]

# ==============================
# YEAR-WISE TOPIC TRENDS
# ==============================
def get_year_wise_trends(db: Session, subject_id: int):

    # Get top 5 topics first
    top_topics = db.query(
        models.QuestionAnalytics.topic,
        func.count(models.QuestionAnalytics.topic).label("count")
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.topic
    ).order_by(
        func.count(models.QuestionAnalytics.topic).desc()
    ).limit(5).all()

    results = []

    for topic, _ in top_topics:

        yearly_data = db.query(
            models.QuestionAnalytics.exam_year,
            func.count(models.QuestionAnalytics.exam_year)
        ).filter(
            models.QuestionAnalytics.subject_id == subject_id,
            models.QuestionAnalytics.topic == topic
        ).group_by(
            models.QuestionAnalytics.exam_year
        ).order_by(
            models.QuestionAnalytics.exam_year.asc()
        ).all()

        results.append({
            "topic": topic,
            "data": [
                {"year": year, "count": count}
                for year, count in yearly_data
            ]
        })

    return results

from app.ai.llm import generate_answer
import json


# ==============================
# AI STUDY INSIGHT
# ==============================
def generate_ai_insight(db: Session, subject_id: int):

    overview = get_dashboard_overview(db, subject_id)
    heatmap = get_topic_heatmap(db, subject_id)
    difficulty = get_difficulty_distribution(db, subject_id)
    unit_coverage = get_unit_coverage(db, subject_id)
    trends = get_year_wise_trends(db, subject_id)

    data_summary = {
        "overview": overview,
        "top_topics": heatmap[:5],
        "difficulty_distribution": difficulty,
        "unit_coverage": unit_coverage,
        "trends": trends
    }

    prompt = f"""
    You are an academic analytics AI.

    Based on the following exam analytics data,
    generate a professional and concise study insight.

    Data:
    {json.dumps(data_summary, indent=2)}

    Provide:
    - Key focus areas
    - Trend insights
    - Difficulty observation
    - Strategic revision advice

    Keep it under 200 words.
    """

    response = generate_answer(prompt)

    return {
        "insight": response
    }

# ==============================
# YEAR VS DIFFICULTY TREND
# ==============================
def get_year_difficulty_trend(db: Session, subject_id: int):

    data = db.query(
        models.QuestionAnalytics.exam_year,
        models.QuestionAnalytics.difficulty,
        func.count(models.QuestionAnalytics.id)
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).group_by(
        models.QuestionAnalytics.exam_year,
        models.QuestionAnalytics.difficulty
    ).order_by(
        models.QuestionAnalytics.exam_year.asc()
    ).all()

    result = {}

    for year, difficulty, count in data:

        if year not in result:
            result[year] = {
                "year": year,
                "easy": 0,
                "medium": 0,
                "hard": 0
            }

        if difficulty:
            result[year][difficulty] = count

    return list(result.values())

# ==============================
# MOST REPEATED QUESTIONS BY YEAR
# ==============================
def get_repeated_questions_by_year(db: Session, subject_id: int):

    years = db.query(
        models.QuestionAnalytics.exam_year
    ).filter(
        models.QuestionAnalytics.subject_id == subject_id
    ).distinct().all()

    results = []

    for (year,) in years:

        top_questions = db.query(
            models.QuestionAnalytics.question,
            func.count(models.QuestionAnalytics.question).label("count")
        ).filter(
            models.QuestionAnalytics.subject_id == subject_id,
            models.QuestionAnalytics.exam_year == year
        ).group_by(
            models.QuestionAnalytics.question
        ).order_by(
            func.count(models.QuestionAnalytics.question).desc()
        ).limit(5).all()

        results.append({
            "year": year,
            "questions": [
                {
                    "question": question,
                    "frequency": count
                }
                for question, count in top_questions
            ]
        })

    return sorted(results, key=lambda x: x["year"], reverse=True)
