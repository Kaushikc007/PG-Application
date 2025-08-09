#!/usr/bin/env python3
"""
Test script to verify API endpoints.
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test health endpoint."""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_signup_and_login():
    """Test user signup and login."""
    print("Testing user signup and login...")
    
    # Test signup
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User",
        "role": "TENANT",
        "phone": "+1234567890"
    }
    
    print("Testing signup...")
    response = requests.post(f"{BASE_URL}/api/v1/auth/signup", json=signup_data)
    print(f"Signup Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Signup Response: {response.json()}")
    else:
        print(f"Signup Error: {response.text}")
    
    # Test login
    print("\nTesting login...")
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/login-json", json=login_data)
    print(f"Login Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print(f"Login Response: {token_data}")
        return token_data.get("access_token")
    else:
        print(f"Login Error: {response.text}")
        return None
    
    print("-" * 50)

def test_protected_endpoint(token: str):
    """Test protected endpoint with token."""
    print("Testing protected endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
    
    print("-" * 50)

def test_properties_endpoint():
    """Test properties endpoint."""
    print("Testing properties endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/v1/properties/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        properties = response.json()
        print(f"Found {len(properties)} properties")
        if properties:
            print(f"First property: {properties[0]}")
    else:
        print(f"Error: {response.text}")
    
    print("-" * 50)

def main():
    """Main test function."""
    print("PG Application API Tests")
    print("=" * 50)
    
    try:
        # Test basic endpoints
        test_health_endpoint()
        
        # Test authentication
        token = test_signup_and_login()
        
        if token:
            test_protected_endpoint(token)
        
        # Test properties
        test_properties_endpoint()
        
        print("Tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error running tests: {e}")

if __name__ == "__main__":
    main()
