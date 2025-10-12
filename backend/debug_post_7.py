#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.market import MarketPost

def debug_post_7():
    with app.app_context():
        print("=== Debugging Post ID 7 ===")
        
        post = MarketPost.query.get(7)
        if post:
            print(f"Post ID: {post.id}")
            print(f"Title: {post.title}")
            print(f"Status: '{post.status}'")
            print(f"Is Available: {post.is_available}")
            print(f"User ID: {post.user_id}")
            print(f"Type: {post.type}")
            print(f"Approved: {post.approved}")
            print(f"Created: {post.created_at}")
        else:
            print("Post ID 7 not found!")

if __name__ == "__main__":
    debug_post_7()