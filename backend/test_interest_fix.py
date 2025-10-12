#!/usr/bin/env python3

import requests
import json

# Test the market interest endpoint
base_url = "http://localhost:5000"

def test_market_interest():
    print("=== Testing Market Interest Fix ===")
    
    # First, login to get a token
    login_data = {
        "email": "admin@agriconnect.com",
        "password": "admin123"
    }
    
    print("1. Logging in...")
    login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    print(f"   Login status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"   Login failed: {login_response.text}")
        return
        
    token = login_response.json().get('token')
    print(f"   Got token: {token[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get list of posts to find one to test interest
    print("\n2. Getting market posts...")
    posts_response = requests.get(f"{base_url}/api/market/posts", headers=headers)
    print(f"   Posts status: {posts_response.status_code}")
    
    if posts_response.status_code != 200:
        print(f"   Failed to get posts: {posts_response.text}")
        return
        
    posts = posts_response.json().get('posts', [])
    print(f"   Found {len(posts)} posts")
    
    # Find a post with status 'approved' to test
    approved_post = None
    for post in posts:
        print(f"   Post {post['id']}: '{post['title']}' - Status: {post['status']}")
        if post['status'] == 'approved' and post['user_id'] != 1:  # Don't test with admin's own post
            approved_post = post
            break
    
    if not approved_post:
        # Try any post that's not admin's
        for post in posts:
            if post['user_id'] != 1:
                approved_post = post
                break
                
    if not approved_post:
        print("   No suitable post found for testing")
        return
        
    print(f"\n3. Testing interest on post {approved_post['id']}: '{approved_post['title']}'")
    print(f"   Post status: {approved_post['status']}")
    
    # Test expressing interest
    interest_data = {
        "message": "I'm interested in this product. Can we discuss pricing?",
        "offer_quantity": 5
    }
    
    interest_response = requests.post(
        f"{base_url}/api/market/posts/{approved_post['id']}/interest", 
        json=interest_data, 
        headers=headers
    )
    
    print(f"   Interest response status: {interest_response.status_code}")
    print(f"   Interest response: {interest_response.text}")
    
    if interest_response.status_code == 200:
        print("   ✅ SUCCESS: Interest expressed successfully!")
    else:
        print("   ❌ FAILED: Still getting error")

if __name__ == "__main__":
    test_market_interest()