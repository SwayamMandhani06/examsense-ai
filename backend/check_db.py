from app.db.database import get_database

db = get_database()
print("Users:", db.users.count_documents({}))
print("Subjects:", db.subjects.count_documents({}))
print("Materials:", db.materials.count_documents({}))
print("QuestionAnalytics:", db.question_analytics.count_documents({}))
print("DocumentChunks:", db.document_chunks.count_documents({}))

print("\nMaterials:")
for material in db.materials.find({}, {"title": 1, "subject_id": 1, "year": 1, "filename": 1}):
    print(
        f"  id={material.get('_id')} subject_id={material.get('subject_id')} "
        f"year={material.get('year')} title={material.get('title')} file={material.get('filename')}"
    )
