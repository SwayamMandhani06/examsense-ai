"""
Reprocess existing PDFs and populate missing chunks + analytics in MongoDB.

Usage (from backend/):
    python reprocess_pdfs.py
"""

import argparse
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import get_database
from app.routers.subjects import process_pdf_background


def reprocess_all(only_missing_chunks: bool):
    db = get_database()

    materials = list(
        db.materials.find(
            {},
            {
                "_id": 1,
                "subject_id": 1,
                "title": 1,
                "filename": 1,
                "year": 1,
            },
        )
    )

    if not materials:
        print("No materials found.")
        return

    to_process = materials
    if only_missing_chunks:
        to_process = []
        for material in materials:
            chunk_count = db.document_chunks.count_documents({"material_id": material["_id"]})
            if chunk_count == 0:
                to_process.append(material)

    if not to_process:
        print("No materials to process.")
        return

    if only_missing_chunks:
        print(f"Found {len(to_process)} material(s) with no chunks. Processing...\n")
    else:
        print(f"Reprocessing all {len(to_process)} material(s)...\n")

    for material in to_process:
        filename = material.get("filename", "")
        file_path = os.path.join("uploads", filename)
        title = material.get("title", "Untitled")

        print(f"Processing: {title} ({filename})")

        if not os.path.exists(file_path):
            print(f"  File missing: {file_path} — skipping.\n")
            continue

        subject = db.subjects.find_one({"_id": material.get("subject_id")}, {"name": 1})
        subject_name = (subject or {}).get("name", "Subject")
        exam_year = int(material.get("year") or datetime.utcnow().year)

        process_pdf_background(
            material_id=str(material["_id"]),
            subject_id=str(material["subject_id"]),
            subject_name=subject_name,
            exam_year=exam_year,
            file_path=file_path,
        )
        print("  Done.\n")

    print("Finished reprocessing PDFs.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reprocess stored PDFs and rebuild chunks/analytics.")
    parser.add_argument(
        "--only-missing-chunks",
        action="store_true",
        help="Process only materials that currently have no chunks.",
    )
    args = parser.parse_args()
    reprocess_all(only_missing_chunks=args.only_missing_chunks)
