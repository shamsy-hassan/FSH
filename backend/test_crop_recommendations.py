#!/usr/bin/env python3
"""
Test script to debug crop recommendation creation and retrieval
"""
import requests
import json

def test_crop_recommendations():
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
    
    # Get regions first
    print("📍 Getting regions...")
    regions_response = requests.get("http://localhost:5000/api/agroclimate/regions")
    if regions_response.status_code == 200:
        regions = regions_response.json().get('regions', [])
        print(f"✅ Found {len(regions)} regions")
        if regions:
            region_id = regions[0]['id']
            print(f"   Using region: {regions[0]['name']} (ID: {region_id})")
        else:
            print("❌ No regions found, cannot test recommendations")
            return
    else:
        print(f"❌ Failed to get regions: {regions_response.text}")
        return
    
    # Create a test recommendation
    print("🌱 Creating test crop recommendation...")
    recommendation_data = {
        'region_id': region_id,
        'crop_name': 'Test Maize',
        'season': 'rainy',
        'planting_month': 'March',
        'harvesting_month': 'July',
        'expected_yield': '3.5 tons/ha',
        'water_requirements': '600mm/season',
        'soil_requirements': 'Well-drained loamy soil, pH 6-7',
        'description': 'Test recommendation for debugging purposes'
    }
    
    create_response = requests.post(
        "http://localhost:5000/api/agroclimate/crop-recommendations",
        json=recommendation_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    if create_response.status_code == 201:
        result = create_response.json()
        print(f"✅ Recommendation created successfully!")
        print(f"   ID: {result['recommendation']['id']}")
        print(f"   Crop: {result['recommendation']['crop_name']}")
        recommendation_id = result['recommendation']['id']
    else:
        print(f"❌ Failed to create recommendation: {create_response.status_code}")
        print(f"   Response: {create_response.text}")
        return
    
    # Get recommendations for the region
    print(f"📋 Getting recommendations for region {region_id}...")
    get_response = requests.get(f"http://localhost:5000/api/agroclimate/crop-recommendations/{region_id}")
    
    if get_response.status_code == 200:
        recommendations = get_response.json().get('recommendations', [])
        print(f"✅ Retrieved {len(recommendations)} recommendations")
        for rec in recommendations:
            print(f"   - {rec['crop_name']} ({rec['season']}) - ID: {rec['id']}")
    else:
        print(f"❌ Failed to get recommendations: {get_response.text}")
    
    return recommendation_id

if __name__ == "__main__":
    rec_id = test_crop_recommendations()
    if rec_id:
        print(f"\n🎉 Test completed! Created recommendation with ID: {rec_id}")
    else:
        print(f"\n💥 Test failed!")