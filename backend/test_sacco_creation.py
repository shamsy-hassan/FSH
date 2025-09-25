#!/usr/bin/env python3

import requests
import json

# First, get an admin token
admin_login_data = {
    "email": "admin@famar.com",
    "password": "admin123"
}

# Login as admin
login_response = requests.post(
    "http://localhost:5000/api/auth/login",
    json=admin_login_data,
    headers={"Content-Type": "application/json"}
)

if login_response.status_code == 200:
    admin_token = login_response.json()["access_token"]
    print(f"✅ Admin login successful, token: {admin_token[:50]}...")
    
    # Now create a SACCO
    sacco_data = {
        "name": "Debug Test SACCO",
        "description": "A test SACCO created for debugging purposes",
        "region": "Central",
        "location": "Debug Location",
        "registration_number": "DEBUG001",
        "founded_date": "2024-01-01",
        "total_members": "0",
        "total_assets": "0.00"
    }
    
    # Create SACCO using form data (like the frontend does)
    create_response = requests.post(
        "http://localhost:5000/api/sacco/saccos",
        data=sacco_data,  # Using data parameter for form data
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    print(f"SACCO creation response status: {create_response.status_code}")
    print(f"SACCO creation response: {create_response.text}")
    
else:
    print(f"❌ Admin login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")