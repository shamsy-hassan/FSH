#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.market import MarketPost
from models.user import User

def debug_market_posts():
    with app.app_context():
        print("=== Market Posts Debug ===")
        
        # Get all posts
        posts = MarketPost.query.all()
        print(f"\nTotal posts in database: {len(posts)}")
        
        if not posts:
            print("No posts found in database!")
            return
            
        # Check each post's status and availability
        for post in posts:
            print(f"\nPost ID: {post.id}")
            print(f"  Title: {post.title}")
            print(f"  Status: '{post.status}'")
            print(f"  Is Available: {post.is_available}")
            print(f"  User ID: {post.user_id}")
            print(f"  Approved: {post.approved}")
            
        # Check status distribution
        status_counts = {}
        available_counts = {}
        
        for post in posts:
            status_counts[post.status] = status_counts.get(post.status, 0) + 1
            available_counts[post.is_available] = available_counts.get(post.is_available, 0) + 1
            
        print(f"\n=== Status Distribution ===")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")
            
        print(f"\n=== Availability Distribution ===")
        for available, count in available_counts.items():
            print(f"  {available}: {count}")
            
        # Check users
        users = User.query.all()
        print(f"\n=== Users in Database ===")
        for user in users:
            print(f"  User ID: {user.id}, Username: {user.username}")

if __name__ == "__main__":
    debug_market_posts()