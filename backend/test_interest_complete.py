#!/usr/bin/env python3

import requests
import json

# Test the market interest endpoint with proper authentication
base_url = "http://127.0.0.1:5000"

def test_market_interest_fixed():
    print("=== Testing Market Interest Fix ===")
    
    # Login as admin
    login_data = {
        "email": "admin@agriconnect.com",
        "password": "admin123"
    }
    
    print("1. Logging in as admin...")
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
    
    # Test expressing interest in post 15 (approved, owned by user 2)
    print("\n2. Testing interest on post 15 (approved, user 2)...")
    interest_data = {
        "message": "I'm interested in these bananas. What's your best price?",
        "offer_quantity": 10
    }
    
    interest_response = requests.post(
        f"{base_url}/api/market/posts/15/interest", 
        json=interest_data, 
        headers=headers
    )
    
    print(f"   Status: {interest_response.status_code}")
    print(f"   Response: {interest_response.text}")
    
    if interest_response.status_code == 200:
        print("   ✅ SUCCESS: Interest expressed in approved post!")
    else:
        print("   ❌ FAILED: Still getting error for approved post")
    
    # Test expressing interest in post 16 (active, owned by user 2)
    print("\n3. Testing interest on post 16 (active, user 2)...")
    interest_data = {
        "message": "I'm interested in these oranges. Can we negotiate?",
        "offer_quantity": 5
    }
    
    interest_response = requests.post(
        f"{base_url}/api/market/posts/16/interest", 
        json=interest_data, 
        headers=headers
    )
    
    print(f"   Status: {interest_response.status_code}")
    print(f"   Response: {interest_response.text}")
    
    if interest_response.status_code == 200:
        print("   ✅ SUCCESS: Interest expressed in active post!")
    else:
        print("   ❌ FAILED: Still getting error for active post")

    # Test the failing case - post 1 (pending, owned by admin)
    print("\n4. Testing interest on post 1 (pending, admin's own post)...")
    interest_data = {
        "message": "Testing own post",
        "offer_quantity": 1
    }
    
    interest_response = requests.post(
        f"{base_url}/api/market/posts/1/interest", 
        json=interest_data, 
        headers=headers
    )
    
    print(f"   Status: {interest_response.status_code}")
    print(f"   Response: {interest_response.text}")
    
    if interest_response.status_code == 400:
        response_data = interest_response.json()
        if "own post" in response_data.get('message', ''):
            print("   ✅ EXPECTED: Correctly rejected own post")
        elif "not available" in response_data.get('message', ''):
            print("   ✅ EXPECTED: Correctly rejected pending post")
        else:
            print(f"   ❓ UNEXPECTED: {response_data.get('message', '')}")

if __name__ == "__main__":
    test_market_interest_fixed()