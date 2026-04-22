import datetime


# ----------------------------------------
# RECENCY SCORE (Continuous Decay)
# ----------------------------------------
def calculate_recency_score(last_asked):
    """
    Converts datetime into normalized score (0 to 1).
    More recent = higher score.
    """

    if not last_asked:
        return 0.0

    now = datetime.datetime.utcnow()
    days_gap = (now - last_asked).days

    # Exponential-style decay
    score = 1 / (1 + days_gap)

    return min(score, 1.0)


# ----------------------------------------
# FREQUENCY NORMALIZATION
# ----------------------------------------
def normalize_frequency(freq, max_freq):
    """
    Normalize frequency between 0 and 1
    """
    if max_freq == 0:
        return 0.0
    return freq / max_freq


# ----------------------------------------
# FINAL HYBRID SCORE
# ----------------------------------------
def calculate_final_score(similarity, freq_score, recency_score):
    """
    Hybrid Ranking Formula:

    60% Similarity
    25% Frequency
    15% Recency
    """

    return (
        (0.6 * similarity)
        + (0.25 * freq_score)
        + (0.15 * recency_score)
    )
