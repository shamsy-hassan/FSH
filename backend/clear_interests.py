#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.market import MarketInterest
from extensions import db

def clear_test_interests():
    with app.app_context():
        print("=== Clearing Test Interests ===")
        
        # Delete all interests for testing
        interests = MarketInterest.query.all()
        count = len(interests)
        
        for interest in interests:
            db.session.delete(interest)
        
        db.session.commit()
        print(f"Deleted {count} interests for fresh testing")

if __name__ == "__main__":
    clear_test_interests()