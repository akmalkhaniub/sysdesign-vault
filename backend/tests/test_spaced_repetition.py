import unittest
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from spaced_repetition import calculate_sm2_review


class TestSM2Algorithm(unittest.TestCase):
    def test_first_successful_review(self):
        # Repetition 0 -> quality 4 ('Good') -> should move to repetition 1, interval 1.0 day
        rep, interval, ef, next_review = calculate_sm2_review(
            quality=4, repetition=0, interval_days=0.0, ease_factor=2.5
        )
        self.assertEqual(rep, 1)
        self.assertEqual(interval, 1.0)
        self.assertAlmostEqual(ef, 2.5, places=1)
        self.assertIsInstance(next_review, datetime)

    def test_second_successful_review(self):
        # Repetition 1 -> quality 5 ('Easy') -> should move to repetition 2, interval 6.0 days
        rep, interval, ef, next_review = calculate_sm2_review(
            quality=5, repetition=1, interval_days=1.0, ease_factor=2.5
        )
        self.assertEqual(rep, 2)
        self.assertEqual(interval, 6.0)
        # Quality 5 increases ease factor: 2.5 + 0.1 = 2.6
        self.assertEqual(ef, 2.6)

    def test_subsequent_successful_review(self):
        # Repetition 2 -> quality 4 -> interval = 6.0 * 2.5 = 15.0 days
        rep, interval, ef, next_review = calculate_sm2_review(
            quality=4, repetition=2, interval_days=6.0, ease_factor=2.5
        )
        self.assertEqual(rep, 3)
        self.assertEqual(interval, 15.0)

    def test_failed_recall_resets_repetition(self):
        # Quality < 3 (fail / 'Again') -> resets repetition to 0 and interval to 1.0
        rep, interval, ef, next_review = calculate_sm2_review(
            quality=1, repetition=4, interval_days=30.0, ease_factor=2.5
        )
        self.assertEqual(rep, 0)
        self.assertEqual(interval, 1.0)
        # Ease factor is reduced for failed recall
        self.assertLess(ef, 2.5)

    def test_ease_factor_floor_at_1_3(self):
        # Continuous failures should never drop EF below 1.3
        ef = 1.4
        for _ in range(5):
            _, _, ef, _ = calculate_sm2_review(
                quality=0, repetition=0, interval_days=1.0, ease_factor=ef
            )
        self.assertEqual(ef, 1.3)


if __name__ == "__main__":
    unittest.main()
