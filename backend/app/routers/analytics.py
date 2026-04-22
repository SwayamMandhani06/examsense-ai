from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.database import get_db, to_object_id

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _parse_subject_id(subject_id: str):
    try:
        return to_object_id(subject_id, "subject_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _total_questions_for_subject(db: Database, subject_oid) -> int:
    row = next(
        iter(
            db.question_analytics.aggregate(
                [
                    {"$match": {"subject_id": subject_oid}},
                    {"$group": {"_id": None, "count": {"$sum": "$frequency"}}},
                ]
            )
        ),
        None,
    )
    return int((row or {}).get("count", 0))


@router.get("/difficulty-trend")
def difficulty_trend(subject_id: str, db: Database = Depends(get_db)):
    subject_oid = _parse_subject_id(subject_id)

    rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {
                    "$group": {
                        "_id": {"year": "$exam_year", "difficulty": "$difficulty"},
                        "count": {"$sum": "$frequency"},
                    }
                },
                {"$sort": {"_id.year": 1}},
            ]
        )
    )

    year_map: dict[int, dict[str, int]] = {}
    for row in rows:
        year = int(row["_id"]["year"])
        difficulty = str(row["_id"]["difficulty"]).lower()
        if year not in year_map:
            year_map[year] = {"easy": 0, "medium": 0, "hard": 0}
        if difficulty in year_map[year]:
            year_map[year][difficulty] = int(row.get("count", 0))

    return [{"year": year, **counts} for year, counts in sorted(year_map.items(), key=lambda x: x[0])]


@router.get("/repeated-questions")
def repeated_questions(subject_id: str, db: Database = Depends(get_db)):
    subject_oid = _parse_subject_id(subject_id)

    rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {
                    "$addFields": {
                        "group_key": {
                            "$ifNull": [
                                "$question_key",
                                {"$toLower": {"$substrCP": ["$question", 0, 250]}},
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$group_key",
                        "question": {"$first": "$question"},
                        "frequency": {"$sum": "$frequency"},
                        "years": {"$addToSet": "$exam_year"},
                        "topic": {"$first": "$topic"},
                        "unit": {"$first": "$unit"},
                        "difficulty": {"$first": "$difficulty"},
                    }
                },
                {"$sort": {"frequency": -1, "question": 1}},
            ]
        )
    )

    return [
        {
            "question": row.get("question", ""),
            "frequency": int(row.get("frequency", 0)),
            "occurrences": int(row.get("frequency", 0)),
            "years": sorted(int(y) for y in row.get("years", [])),
            "topic": row.get("topic"),
            "unit": row.get("unit"),
            "difficulty": row.get("difficulty"),
        }
        for row in rows
    ]


@router.get("/topic-distribution")
def topic_distribution(subject_id: str, db: Database = Depends(get_db)):
    subject_oid = _parse_subject_id(subject_id)
    total_questions = _total_questions_for_subject(db, subject_oid)

    rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {"$group": {"_id": "$topic", "count": {"$sum": "$frequency"}}},
                {"$sort": {"count": -1}},
            ]
        )
    )

    result = []
    for row in rows:
        count = int(row.get("count", 0))
        percentage = round((count / total_questions) * 100, 2) if total_questions else 0
        result.append({"topic": row.get("_id") or "General", "count": count, "percentage": percentage})
    return result


@router.get("/unit-distribution")
def unit_distribution(subject_id: str, db: Database = Depends(get_db)):
    subject_oid = _parse_subject_id(subject_id)
    total_questions = _total_questions_for_subject(db, subject_oid)

    rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {"$group": {"_id": "$unit", "count": {"$sum": "$frequency"}}},
                {"$sort": {"_id": 1}},
            ]
        )
    )

    result = []
    for row in rows:
        count = int(row.get("count", 0))
        percentage = round((count / total_questions) * 100, 2) if total_questions else 0
        result.append(
            {
                "unit": str(row.get("_id")),
                "count": count,
                "unitNumber": int(row.get("_id")) if str(row.get("_id")).isdigit() else None,
                "percentage": percentage,
            }
        )
    return result


@router.get("/difficulty-distribution")
def difficulty_distribution(subject_id: str, db: Database = Depends(get_db)):
    subject_oid = _parse_subject_id(subject_id)
    total_questions = _total_questions_for_subject(db, subject_oid)

    rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {"$group": {"_id": "$difficulty", "count": {"$sum": "$frequency"}}},
                {"$sort": {"count": -1}},
            ]
        )
    )

    result = []
    for row in rows:
        count = int(row.get("count", 0))
        percentage = round((count / total_questions) * 100, 2) if total_questions else 0
        result.append({"difficulty": str(row.get("_id")).lower(), "count": count, "percentage": percentage})
    return result


@router.get("/summary")
def analytics_summary(subject_id: str | None = None, db: Database = Depends(get_db)):
    match_filter = {}
    subject_oid = None
    if subject_id:
        subject_oid = _parse_subject_id(subject_id)
        match_filter["subject_id"] = subject_oid

    diff_rows = list(
        db.question_analytics.aggregate(
            [
                {"$match": match_filter},
                {"$group": {"_id": "$difficulty", "count": {"$sum": "$frequency"}}},
            ]
        )
    )

    easy = medium = hard = 0
    for row in diff_rows:
        level = str(row.get("_id", "")).lower()
        count = int(row.get("count", 0))
        if level == "easy":
            easy = count
        elif level == "medium":
            medium = count
        elif level == "hard":
            hard = count

    total_questions = easy + medium + hard
    material_filter = {"subject_id": subject_oid} if subject_oid else {}
    total_materials = db.materials.count_documents(material_filter)

    top_topic_row = next(
        iter(
            db.question_analytics.aggregate(
                [
                    {"$match": match_filter},
                    {"$group": {"_id": "$topic", "count": {"$sum": "$frequency"}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 1},
                ]
            )
        ),
        None,
    )
    most_repeated_topic = (top_topic_row or {}).get("_id") or "General"

    weighted_total = easy + (2 * medium) + (3 * hard)
    avg_score = (weighted_total / total_questions) if total_questions else 0
    if avg_score <= 1.5:
        avg_difficulty = "easy"
    elif avg_score <= 2.3:
        avg_difficulty = "medium"
    else:
        avg_difficulty = "hard"

    return {
        "total_questions": total_questions,
        "easy": easy,
        "medium": medium,
        "hard": hard,
        "totalQuestions": total_questions,
        "totalMaterials": total_materials,
        "mostRepeatedTopic": most_repeated_topic,
        "avgDifficulty": avg_difficulty,
        "predictionConfidence": 0,
    }
