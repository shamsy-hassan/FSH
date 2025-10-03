#!/usr/bin/env python3
"""
Test script to verify category creation functionality
"""
import requests
import json

# Test creating a category via API
def test_category_creation():
    # First, login as admin to get token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    login_response = requests.post(
        "http://localhost:5000/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print(f"✅ Admin login successful")
    
    # Now test category creation
    category_data = {
        'name': 'Test Seeds Category',
        'type': 'seeds',
        'description': 'A test category for agricultural seeds'
    }
    
    print("📦 Creating test category...")
    category_response = requests.post(
        "http://localhost:5000/api/ecommerce/categories",
        data=category_data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if category_response.status_code == 201:
        result = category_response.json()
        print(f"✅ Category created successfully!")
        print(f"   Category ID: {result['category']['id']}")
        print(f"   Category Name: {result['category']['name']}")
        print(f"   Category Type: {result['category']['type']}")
        return result['category']['id']
    else:
        print(f"❌ Category creation failed: {category_response.status_code}")
        print(f"   Response: {category_response.text}")
        return None

if __name__ == "__main__":
    category_id = test_category_creation()
    if category_id:
        print(f"\n🎉 Test completed successfully! Category created with ID: {category_id}")
    else:
        print(f"\n💥 Test failed!")