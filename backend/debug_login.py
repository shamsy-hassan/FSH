#!/usr/bin/env python3
"""
Debug script to test the login endpoint directly
"""
from app import app
from models.user import User
from models.admin import Admin
from flask import request, jsonify
import json

def debug_login(username, password):
    with app.app_context():
        print(f"=== Debug Login for {username} ===")
        
        # Simulate the login logic exactly as in the route
        print(f"Username: '{username}', Password: '{password}'")
        
        if not username or not password:
            print("Missing username or password")
            return False, "Username and password are required"
        
        # First try to authenticate as regular user
        print("Looking up user...")
        user = User.query.filter_by(username=username).first()
        print(f"User found: {user is not None}")
        
        if user:
            print(f"User details: ID={user.id}, username='{user.username}', active={user.is_active}")
            password_check = user.check_password(password)
            print(f"Password check result: {password_check}")
            
            if password_check:
                if not user.is_active:
                    print("Account is deactivated")
                    return False, "Account is deactivated"
                
                print("User authentication successful!")
                return True, "User login successful"
        
        # If not a user, try to authenticate as admin
        print("Looking up admin...")
        admin = Admin.query.filter_by(username=username).first()
        print(f"Admin found: {admin is not None}")
        
        if admin:
            print(f"Admin details: ID={admin.id}, username='{admin.username}', active={admin.is_active}")
            password_check = admin.check_password(password)
            print(f"Admin password check result: {password_check}")
            
            if password_check:
                if not admin.is_active:
                    print("Admin account is deactivated")
                    return False, "Admin account is deactivated"
                
                print("Admin authentication successful!")
                return True, "Admin login successful"
        
        print("Neither user nor admin found with valid credentials")
        return False, "Invalid username or password"

if __name__ == "__main__":
    success, message = debug_login("testuser", "password123")
    print(f"\nResult: {success}, Message: {message}")
    
    # Also test admin
    print("\n" + "="*50)
    success, message = debug_login("admin", "admin123")
    print(f"\nAdmin Result: {success}, Message: {message}")