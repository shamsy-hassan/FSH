#!/usr/bin/env python3
"""
Test script to verify the 400 error details
"""
import requests
import json

def test_product_creation_with_missing_data():
    # Login as admin first
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
    
    # Test 1: Create product with missing category_id
    print("\n📦 Test 1: Creating product with empty category_id...")
    product_data = {
        'name': 'Test Product Without Category',
        'description': 'Test description',
        'price': '10.99',
        'category_id': '',  # Empty category_id
        'stock_quantity': '5'
    }
    
    response = requests.post(
        "http://localhost:5000/api/ecommerce/products",
        data=product_data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test 2: Create product with missing name
    print("\n📦 Test 2: Creating product with empty name...")
    product_data_2 = {
        'name': '',  # Empty name
        'description': 'Test description',
        'price': '10.99',
        'category_id': '1',
        'stock_quantity': '5'
    }
    
    response2 = requests.post(
        "http://localhost:5000/api/ecommerce/products",
        data=product_data_2,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    print(f"Status Code: {response2.status_code}")
    print(f"Response: {response2.text}")

if __name__ == "__main__":
    test_product_creation_with_missing_data()