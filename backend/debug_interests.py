#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.market import MarketPost, MarketInterest
from models.user import User

def debug_interests():
    with app.app_context():
        print("=== Market Interests Debug ===")
        
        # Get all interests
        interests = MarketInterest.query.all()
        print(f"\nTotal interests in database: {len(interests)}")
        
        if interests:
            for interest in interests:
                print(f"\nInterest ID: {interest.id}")
                print(f"  Post ID: {interest.market_post_id}")
                print(f"  User ID: {interest.user_id}")
                print(f"  Status: {interest.status}")
                print(f"  Message: {interest.message}")
                print(f"  Admin Requested: {interest.admin_requested}")
                print(f"  Created: {interest.created_at}")
        
        # Check specific post 15
        print(f"\n=== Post 15 Interests ===")
        post_15_interests = MarketInterest.query.filter_by(market_post_id=15).all()
        print(f"Interests in post 15: {len(post_15_interests)}")
        
        for interest in post_15_interests:
            user = User.query.get(interest.user_id)
            print(f"  User: {user.username if user else 'Unknown'} (ID: {interest.user_id})")
            print(f"  Status: {interest.status}")
            print(f"  Admin: {interest.admin_requested}")

if __name__ == "__main__":
    debug_interests()