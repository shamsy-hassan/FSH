#!/usr/bin/env python3
"""
Test script to verify the product creation API endpoint fix
"""
import requests
import json

def test_product_api():
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
    
    # First create a category if needed
    print("📦 Creating test category...")
    category_data = {
        'name': 'API Test Category',
        'type': 'tools',
        'description': 'A test category created via API'
    }
    
    category_response = requests.post(
        "http://localhost:5000/api/ecommerce/categories",
        data=category_data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if category_response.status_code == 201:
        category_id = category_response.json()['category']['id']
        print(f"✅ Category created with ID: {category_id}")
    else:
        # Try to get existing categories
        cat_list_response = requests.get("http://localhost:5000/api/ecommerce/categories")
        if cat_list_response.status_code == 200:
            categories = cat_list_response.json()['categories']
            if categories:
                category_id = categories[0]['id']
                print(f"✅ Using existing category with ID: {category_id}")
            else:
                print("❌ No categories available")
                return
        else:
            print(f"❌ Failed to get categories: {cat_list_response.text}")
            return
    
    # Now test product creation with all fields including discount and is_featured
    print("🛍️ Creating test product...")
    product_data = {
        'name': 'API Test Product',
        'description': 'A test product created via API with all fields',
        'price': '25.99',
        'category_id': str(category_id),
        'stock_quantity': '10',
        'brand': 'Test Brand',
        'weight': '2.5',
        'dimensions': '15x10x5',
        'is_active': 'true',
        'discount': '5.0',  # 5% discount
        'is_featured': 'true'
    }
    
    product_response = requests.post(
        "http://localhost:5000/api/ecommerce/products",
        data=product_data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if product_response.status_code == 201:
        result = product_response.json()
        print(f"✅ Product created successfully!")
        print(f"   Product ID: {result['product']['id']}")
        print(f"   Product Name: {result['product']['name']}")
        print(f"   Product Price: {result['product']['price']}")
        print(f"   Product Discount: {result['product']['discount']}")
        print(f"   Product Is Featured: {result['product']['is_featured']}")
        return result['product']['id']
    else:
        print(f"❌ Product creation failed: {product_response.status_code}")
        print(f"   Response: {product_response.text}")
        return None

if __name__ == "__main__":
    product_id = test_product_api()
    if product_id:
        print(f"\n🎉 Test completed successfully! Product created with ID: {product_id}")
    else:
        print(f"\n💥 Test failed!")