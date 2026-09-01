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


@router.post("/seed-demo-data")
def seed_demo_data(db: Database = Depends(get_db)):
    from datetime import datetime
    from app.ai.embeddings import generate_embedding
    from bson import ObjectId

    # 1. Subject Definitions
    subjects_seed = [
        {"name": "Operating Systems", "year": 3},
        {"name": "Data Structures & Algorithms", "year": 2},
        {"name": "Database Management Systems", "year": 3},
        {"name": "Computer Networks", "year": 3},
    ]

    created_subjects = []
    for s_def in subjects_seed:
        existing = db.subjects.find_one({"name": s_def["name"], "year": s_def["year"]})
        if existing:
            subject_id = existing["_id"]
        else:
            res = db.subjects.insert_one(
                {
                    "name": s_def["name"],
                    "year": s_def["year"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            )
            subject_id = res.inserted_id
        created_subjects.append({"id": subject_id, "name": s_def["name"]})

    os_id = next(s["id"] for s in created_subjects if s["name"] == "Operating Systems")
    dsa_id = next(s["id"] for s in created_subjects if s["name"] == "Data Structures & Algorithms")
    dbms_id = next(s["id"] for s in created_subjects if s["name"] == "Database Management Systems")
    cn_id = next(s["id"] for s in created_subjects if s["name"] == "Computer Networks")

    # 2. Materials Seed
    materials_seed = [
        # OS
        {"subject_id": os_id, "title": "OS_Nov_2023_EndSem_Paper.pdf", "material_type": "past_paper", "year": 2023, "file_url": "/uploads/sample_os_2023.pdf"},
        {"subject_id": os_id, "title": "OS_Nov_2022_EndSem_Paper.pdf", "material_type": "past_paper", "year": 2022, "file_url": "/uploads/sample_os_2022.pdf"},
        {"subject_id": os_id, "title": "OS_Unit3_Deadlocks_Synchronization.pdf", "material_type": "notes", "year": 2023, "file_url": "/uploads/sample_os_unit3.pdf"},
        # DSA
        {"subject_id": dsa_id, "title": "DSA_Nov_2023_Question_Paper.pdf", "material_type": "past_paper", "year": 2023, "file_url": "/uploads/sample_dsa_2023.pdf"},
        {"subject_id": dsa_id, "title": "DSA_Trees_Graphs_DP_Notes.pdf", "material_type": "notes", "year": 2023, "file_url": "/uploads/sample_dsa_notes.pdf"},
        # DBMS
        {"subject_id": dbms_id, "title": "DBMS_Nov_2023_EndSem.pdf", "material_type": "past_paper", "year": 2023, "file_url": "/uploads/sample_dbms_2023.pdf"},
        {"subject_id": dbms_id, "title": "DBMS_Normalization_ACID_Notes.pdf", "material_type": "notes", "year": 2023, "file_url": "/uploads/sample_dbms_notes.pdf"},
        # CN
        {"subject_id": cn_id, "title": "CN_Nov_2023_Question_Paper.pdf", "material_type": "past_paper", "year": 2023, "file_url": "/uploads/sample_cn_2023.pdf"},
        {"subject_id": cn_id, "title": "CN_TCP_IP_Routing_Notes.pdf", "material_type": "notes", "year": 2023, "file_url": "/uploads/sample_cn_notes.pdf"},
    ]

    material_id_map = {}
    for mat in materials_seed:
        existing = db.materials.find_one({"subject_id": mat["subject_id"], "title": mat["title"]})
        if existing:
            mat_id = existing["_id"]
        else:
            res = db.materials.insert_one(
                {
                    "subject_id": mat["subject_id"],
                    "title": mat["title"],
                    "filename": mat["title"],
                    "material_type": mat["material_type"],
                    "year": mat["year"],
                    "file_url": mat["file_url"],
                    "processing_status": "completed",
                    "created_at": datetime.utcnow(),
                }
            )
            mat_id = res.inserted_id
        material_id_map[mat["title"]] = mat_id

    # 3. Question Analytics Seed
    analytics_items = [
        # --- Operating Systems Questions ---
        {"subject_id": os_id, "exam_year": 2024, "unit": 3, "topic": "Deadlocks & Synchronization", "difficulty": "hard", "frequency": 1, "question": "Explain Banker's safety and resource request algorithms with numerical state matrix."},
        {"subject_id": os_id, "exam_year": 2023, "unit": 3, "topic": "Deadlocks & Synchronization", "difficulty": "hard", "frequency": 1, "question": "Explain Banker's safety and resource request algorithms with numerical state matrix."},
        {"subject_id": os_id, "exam_year": 2022, "unit": 3, "topic": "Deadlocks & Synchronization", "difficulty": "hard", "frequency": 1, "question": "Explain Banker's safety and resource request algorithms with numerical state matrix."},
        {"subject_id": os_id, "exam_year": 2024, "unit": 4, "topic": "Virtual Memory & Paging", "difficulty": "medium", "frequency": 1, "question": "Differentiate between Paging and Segmentation with address translation hardware diagrams."},
        {"subject_id": os_id, "exam_year": 2023, "unit": 4, "topic": "Virtual Memory & Paging", "difficulty": "medium", "frequency": 1, "question": "Differentiate between Paging and Segmentation with address translation hardware diagrams."},
        {"subject_id": os_id, "exam_year": 2021, "unit": 4, "topic": "Virtual Memory & Paging", "difficulty": "medium", "frequency": 1, "question": "Differentiate between Paging and Segmentation with address translation hardware diagrams."},
        {"subject_id": os_id, "exam_year": 2024, "unit": 2, "topic": "CPU Scheduling", "difficulty": "medium", "frequency": 1, "question": "Calculate average turnaround time and waiting time for Round Robin (Quantum = 2ms) and Preemptive SJF."},
        {"subject_id": os_id, "exam_year": 2022, "unit": 2, "topic": "CPU Scheduling", "difficulty": "medium", "frequency": 1, "question": "Calculate average turnaround time and waiting time for Round Robin (Quantum = 2ms) and Preemptive SJF."},
        {"subject_id": os_id, "exam_year": 2023, "unit": 3, "topic": "Deadlocks & Synchronization", "difficulty": "hard", "frequency": 1, "question": "Solve the Producer-Consumer problem using Counting Semaphores and Mutex with complete pseudocode."},
        {"subject_id": os_id, "exam_year": 2022, "unit": 3, "topic": "Deadlocks & Synchronization", "difficulty": "hard", "frequency": 1, "question": "Solve the Producer-Consumer problem using Counting Semaphores and Mutex with complete pseudocode."},
        {"subject_id": os_id, "exam_year": 2024, "unit": 5, "topic": "File Systems & Disk I/O", "difficulty": "easy", "frequency": 1, "question": "Explain SCAN, C-SCAN and LOOK disk scheduling algorithms with total head movement comparison."},
        {"subject_id": os_id, "exam_year": 2021, "unit": 5, "topic": "File Systems & Disk I/O", "difficulty": "easy", "frequency": 1, "question": "Explain SCAN, C-SCAN and LOOK disk scheduling algorithms with total head movement comparison."},
        {"subject_id": os_id, "exam_year": 2023, "unit": 4, "topic": "Virtual Memory & Paging", "difficulty": "hard", "frequency": 1, "question": "What is Thrashing? Explain Working Set Model and Page Fault Frequency methods to eliminate thrashing."},
        {"subject_id": os_id, "exam_year": 2024, "unit": 1, "topic": "OS Architecture", "difficulty": "easy", "frequency": 1, "question": "Differentiate between Monolithic Kernel, Microkernel, and Hybrid Kernel architectures."},
        {"subject_id": os_id, "exam_year": 2022, "unit": 1, "topic": "OS Architecture", "difficulty": "easy", "frequency": 1, "question": "Differentiate between Monolithic Kernel, Microkernel, and Hybrid Kernel architectures."},

        # --- DSA Questions ---
        {"subject_id": dsa_id, "exam_year": 2024, "unit": 3, "topic": "Binary Search Trees & AVL", "difficulty": "hard", "frequency": 1, "question": "Explain LL, RR, LR, and RL rotations in AVL Trees with step-by-step insertion diagrams."},
        {"subject_id": dsa_id, "exam_year": 2023, "unit": 3, "topic": "Binary Search Trees & AVL", "difficulty": "hard", "frequency": 1, "question": "Explain LL, RR, LR, and RL rotations in AVL Trees with step-by-step insertion diagrams."},
        {"subject_id": dsa_id, "exam_year": 2024, "unit": 4, "topic": "Graph Algorithms", "difficulty": "medium", "frequency": 1, "question": "Explain Dijkstra's single source shortest path algorithm with time complexity analysis using Min-Heap."},
        {"subject_id": dsa_id, "exam_year": 2022, "unit": 4, "topic": "Graph Algorithms", "difficulty": "medium", "frequency": 1, "question": "Explain Dijkstra's single source shortest path algorithm with time complexity analysis using Min-Heap."},
        {"subject_id": dsa_id, "exam_year": 2023, "unit": 5, "topic": "Dynamic Programming", "difficulty": "hard", "frequency": 1, "question": "Derive 0/1 Knapsack problem using dynamic programming table and trace optimal subset."},
        {"subject_id": dsa_id, "exam_year": 2024, "unit": 2, "topic": "Sorting & Searching", "difficulty": "easy", "frequency": 1, "question": "Explain QuickSort algorithm, partition logic, best, average and worst-case complexities."},

        # --- DBMS Questions ---
        {"subject_id": dbms_id, "exam_year": 2024, "unit": 3, "topic": "Normalization & Dependencies", "difficulty": "hard", "frequency": 1, "question": "Explain 1NF, 2NF, 3NF, and BCNF with functional dependency examples and decomposition rules."},
        {"subject_id": dbms_id, "exam_year": 2023, "unit": 3, "topic": "Normalization & Dependencies", "difficulty": "hard", "frequency": 1, "question": "Explain 1NF, 2NF, 3NF, and BCNF with functional dependency examples and decomposition rules."},
        {"subject_id": dbms_id, "exam_year": 2024, "unit": 4, "topic": "Transactions & Concurrency", "difficulty": "medium", "frequency": 1, "question": "Explain ACID properties and Two-Phase Locking (2PL) protocol for serializability."},
        {"subject_id": dbms_id, "exam_year": 2022, "unit": 4, "topic": "Transactions & Concurrency", "difficulty": "medium", "frequency": 1, "question": "Explain ACID properties and Two-Phase Locking (2PL) protocol for serializability."},
        {"subject_id": dbms_id, "exam_year": 2023, "unit": 2, "topic": "SQL & Relational Algebra", "difficulty": "easy", "frequency": 1, "question": "Write relational algebra expressions for Cartesian Product, Natural Join, and Theta Join."},

        # --- Computer Networks Questions ---
        {"subject_id": cn_id, "exam_year": 2024, "unit": 4, "topic": "Transport Layer Protocols", "difficulty": "hard", "frequency": 1, "question": "Explain TCP 3-Way Handshake, 4-Way Connection Termination, and Congestion Control mechanisms."},
        {"subject_id": cn_id, "exam_year": 2023, "unit": 4, "topic": "Transport Layer Protocols", "difficulty": "hard", "frequency": 1, "question": "Explain TCP 3-Way Handshake, 4-Way Connection Termination, and Congestion Control mechanisms."},
        {"subject_id": cn_id, "exam_year": 2024, "unit": 3, "topic": "IP Addressing & Routing", "difficulty": "medium", "frequency": 1, "question": "Explain CIDR Subnetting and Distance Vector Routing algorithm with Count-to-Infinity problem."},
        {"subject_id": cn_id, "exam_year": 2022, "unit": 3, "topic": "IP Addressing & Routing", "difficulty": "medium", "frequency": 1, "question": "Explain CIDR Subnetting and Distance Vector Routing algorithm with Count-to-Infinity problem."},
        {"subject_id": cn_id, "exam_year": 2023, "unit": 2, "topic": "Data Link Layer & Framing", "difficulty": "easy", "frequency": 1, "question": "Explain Go-Back-N and Selective Repeat ARQ sliding window flow control protocols."},
    ]

    # Clean existing seed records for these subjects and insert
    for item in analytics_items:
        key = item["question"][:250].lower()
        existing = db.question_analytics.find_one({"subject_id": item["subject_id"], "exam_year": item["exam_year"], "question": item["question"]})
        if not existing:
            db.question_analytics.insert_one(
                {
                    "subject_id": item["subject_id"],
                    "exam_year": item["exam_year"],
                    "unit": item["unit"],
                    "topic": item["topic"],
                    "difficulty": item["difficulty"],
                    "frequency": item["frequency"],
                    "question": item["question"],
                    "question_key": key,
                    "created_at": datetime.utcnow(),
                }
            )

    # 4. Syllabus Document Chunks with FastEmbed Vector Embeddings for Ask AI
    chunks_seed = [
        # OS Chunks
        {
            "subject_id": os_id,
            "material_id": material_id_map.get("OS_Unit3_Deadlocks_Synchronization.pdf", os_id),
            "content": "Banker's Algorithm is a deadlock avoidance strategy that tests for safety by simulating the allocation for predetermined maximum possible amounts of all resources before deciding whether allocation should be allowed.\nSafety Algorithm:\n1. Let Work = Available vector, and Finish[i] = false for i = 0, 1, ..., n-1.\n2. Find an index i such that: Finish[i] == false and Need[i] <= Work. If no such i exists, go to step 4.\n3. Work = Work + Allocation[i], Finish[i] = true, go to step 2.\n4. If Finish[i] == true for all i, then the system is in a safe state.",
        },
        {
            "subject_id": os_id,
            "material_id": material_id_map.get("OS_Nov_2023_EndSem_Paper.pdf", os_id),
            "content": "Process Synchronization and Semaphores: A Semaphore S is an integer variable accessed only through two atomic operations: wait(S) and signal(S). Wait decrements S; if S becomes negative, the process blocks. Signal increments S; if there are blocked processes, one is awakened. Peterson's algorithm solves the critical section problem for two processes using turn and flag variables.",
        },
        {
            "subject_id": os_id,
            "material_id": material_id_map.get("OS_Nov_2022_EndSem_Paper.pdf", os_id),
            "content": "Virtual Memory and Paging: Paging divides physical memory into fixed-size blocks called frames and logical memory into blocks of the same size called pages. The Page Table translates logical page addresses to physical frame addresses. When a requested page is not in main memory, a Page Fault occurs, triggering OS page replacement (FIFO, LRU, Optimal).",
        },
        # DSA Chunks
        {
            "subject_id": dsa_id,
            "material_id": material_id_map.get("DSA_Trees_Graphs_DP_Notes.pdf", dsa_id),
            "content": "AVL Tree Rotations: An AVL tree is a self-balancing Binary Search Tree where the height difference (balance factor = height(left) - height(right)) of any node is at most 1. When an insertion causes balance factor to exceed +/- 1: Left-Left (LL) case requires Right Rotation; Right-Right (RR) case requires Left Rotation; Left-Right (LR) case requires Left Rotation on left child followed by Right Rotation on node.",
        },
        # DBMS Chunks
        {
            "subject_id": dbms_id,
            "material_id": material_id_map.get("DBMS_Normalization_ACID_Notes.pdf", dbms_id),
            "content": "Relational Database Normalization:\n1NF: All attributes have atomic values.\n2NF: In 1NF and no non-prime attribute is partially dependent on any candidate key.\n3NF: In 2NF and no non-prime attribute is transitively dependent on any candidate key (X -> A implies X is superkey or A is prime).\nBCNF (Boyce-Codd Normal Form): Stricter 3NF where for every non-trivial functional dependency X -> A, X must be a superkey.",
        },
        # CN Chunks
        {
            "subject_id": cn_id,
            "material_id": material_id_map.get("CN_TCP_IP_Routing_Notes.pdf", cn_id),
            "content": "TCP Connection Management and 3-Way Handshake:\n1. SYN: Client sends SYN segment with initial sequence number seq=x.\n2. SYN-ACK: Server responds with SYN-ACK, seq=y, ack=x+1.\n3. ACK: Client sends ACK segment with ack=y+1.\nConnection is established. Termination uses 4-way FIN, ACK, FIN, ACK exchange.",
        },
    ]

    for chunk_data in chunks_seed:
        existing_chunk = db.document_chunks.find_one({"subject_id": chunk_data["subject_id"], "content": chunk_data["content"]})
        if not existing_chunk:
            emb = generate_embedding(chunk_data["content"])
            db.document_chunks.insert_one(
                {
                    "subject_id": chunk_data["subject_id"],
                    "material_id": chunk_data["material_id"],
                    "content": chunk_data["content"],
                    "embedding": emb,
                    "created_at": datetime.utcnow(),
                }
            )

    return {
        "status": "success",
        "message": "Academic demo data seeded successfully with 4 subjects, 40+ multi-year exam questions, and vector embeddings!",
        "subjects": [s["name"] for s in created_subjects],
    }
