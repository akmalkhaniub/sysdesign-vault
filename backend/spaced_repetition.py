"""
SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
"""
from datetime import datetime, timedelta
from typing import Tuple

def calculate_sm2_review(
    quality: int,
    repetition: int,
    interval_days: float,
    ease_factor: float
) -> Tuple[int, float, float, datetime]:
    """
    Computes updated SM-2 parameters based on recall performance.

    quality: Integer from 0 to 5
      - 1: 'Again' (fail, reset)
      - 3: 'Hard'
      - 4: 'Good'
      - 5: 'Easy'
    
    Returns: (new_repetition, new_interval_days, new_ease_factor, next_review_at)
    """
    # Clamp quality to 0..5
    q = max(0, min(5, quality))

    # Calculate new ease factor
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if new_ef < 1.3:
        new_ef = 1.3

    if q < 3:
        # Failure: reset repetition count and review tomorrow
        new_rep = 0
        new_interval = 1.0
    else:
        # Successful recall
        if repetition == 0:
            new_interval = 1.0
        elif repetition == 1:
            new_interval = 6.0
        else:
            new_interval = round(interval_days * new_ef, 1)
        new_rep = repetition + 1

    next_review = datetime.utcnow() + timedelta(days=new_interval)
    return new_rep, new_interval, round(new_ef, 3), next_review
