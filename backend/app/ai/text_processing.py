import re


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200):
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    # Split by sentence boundaries first to preserve semantics.
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        if not sentence:
            continue
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current)

        # Start next chunk with overlap from previous chunk tail.
        if current and overlap > 0:
            tail = current[-overlap:]
            current = f"{tail} {sentence}".strip()
        else:
            current = sentence

        # Hard split if one sentence itself is too long.
        while len(current) > chunk_size:
            chunks.append(current[:chunk_size])
            current = current[max(chunk_size - overlap, 1):].strip()

    if current:
        chunks.append(current)

    return chunks
