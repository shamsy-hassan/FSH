#!/usr/bin/env python3

import subprocess
import json

# Test the backend API
def test_backend():
    print("=== Testing Backend API ===")
    
    # Test login
    print("1. Testing login...")
    login_cmd = [
        'curl', '-s', '-X', 'POST', 
        'http://localhost:5000/api/auth/login',
        '-H', 'Content-Type: application/json',
        '-d', '{"email":"admin@agriconnect.com","password":"admin123"}'
    ]
    
    try:
        result = subprocess.run(login_cmd, capture_output=True, text=True, timeout=10)
        print(f"   Status: {result.returncode}")
        print(f"   Response: {result.stdout[:200]}...")
        
        if result.returncode == 0 and result.stdout:
            try:
                response = json.loads(result.stdout)
                if 'token' in response:
                    token = response['token']
                    print(f"   ✅ Login successful! Token: {token[:50]}...")
                    return token
                else:
                    print(f"   ❌ No token in response: {response}")
            except json.JSONDecodeError:
                print(f"   ❌ Invalid JSON response: {result.stdout}")
        else:
            print(f"   ❌ Login failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("   ❌ Request timed out")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return None

if __name__ == "__main__":
    test_backend()