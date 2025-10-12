#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.market import MarketPost
from models.user import User
from extensions import db
from werkzeug.security import generate_password_hash
import datetime

def create_test_data():
    with app.app_context():
        print("=== Creating Test Data ===")
        
        # Create a test user (not admin)
        test_user = User.query.filter_by(email='testuser@agriconnect.com').first()
        if not test_user:
            test_user = User(
                username='testuser',
                email='testuser@agriconnect.com',
                password_hash=generate_password_hash('password123'),
                is_verified=True
            )
            db.session.add(test_user)
            db.session.commit()
            print(f"Created test user: ID {test_user.id}")
        else:
            print(f"Test user exists: ID {test_user.id}")
        
        # Create an approved post from the test user
        approved_post = MarketPost(
            title="Test Approved Bananas",
            description="Fresh bananas ready for sale",
            price=2.50,
            quantity=100,
            unit="kg",
            category="crops",
            location="Test Farm",
            region="Test Region",
            user_id=test_user.id,
            type="product",
            status="approved",  # This should allow interest
            is_available=True,
            approved=True
        )
        db.session.add(approved_post)
        
        # Create an active post from the test user
        active_post = MarketPost(
            title="Test Active Oranges",
            description="Fresh oranges for immediate sale",
            price=3.00,
            quantity=50,
            unit="kg",
            category="crops",
            location="Test Farm",
            region="Test Region",
            user_id=test_user.id,
            type="product",
            status="active",  # This should also allow interest
            is_available=True,
            approved=True
        )
        db.session.add(active_post)
        
        db.session.commit()
        
        print(f"Created approved post: ID {approved_post.id}")
        print(f"Created active post: ID {active_post.id}")
        
        # List all posts for reference
        print("\n=== All Posts ===")
        posts = MarketPost.query.all()
        for post in posts:
            print(f"Post ID {post.id}: '{post.title}' - Status: '{post.status}', User: {post.user_id}")

if __name__ == "__main__":
    create_test_data()