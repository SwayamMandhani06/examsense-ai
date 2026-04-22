import numpy as np


# ----------------------------------------
# COSINE SIMILARITY
# ----------------------------------------
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot_product / (norm_a * norm_b)

    # Ensure value stays between 0 and 1
    return float(max(min(similarity, 1.0), 0.0))


# ----------------------------------------
# FIND TOP K SIMILAR CHUNKS
# ----------------------------------------
def find_top_k(question_embedding, chunks, k=5):
    """
    Returns structured list of chunks with similarity score.

    Output format:
    [
        {
            "chunk_id": int,
            "content": str,
            "material_id": int,
            "similarity": float
        }
    ]
    """

    scored_chunks = []

    for chunk in chunks:
        similarity_score = cosine_similarity(
            question_embedding,
            chunk.embedding
        )

        scored_chunks.append({
            "chunk_id": chunk.id,
            "content": chunk.content,
            "material_id": chunk.material_id,
            "similarity": similarity_score
        })

    # Sort by similarity descending
    scored_chunks.sort(
        key=lambda x: x["similarity"],
        reverse=True
    )

    return scored_chunks[:k]
