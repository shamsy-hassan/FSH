#!/usr/bin/env python3
"""
Script to help set up Tomorrow.io weather API key for FSH AgriConnect

Instructions:
1. Go to https://www.tomorrow.io/
2. Sign up for a free account
3. Navigate to your dashboard and get your API key
4. Run this script and paste your API key when prompted
"""

import os
import requests

def test_api_key(api_key):
    """Test if the API key works with Tomorrow.io"""
    try:
        url = "https://api.tomorrow.io/v4/weather/realtime"
        params = {
            'location': '0,0',  # Test coordinates
            'units': 'metric',
            'apikey': api_key
        }
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            print("✅ API key is valid and working!")
            return True
        elif response.status_code == 401:
            print("❌ API key is invalid or unauthorized")
            return False
        elif response.status_code == 429:
            print("⚠️  API key is valid but rate limit exceeded")
            return True
        else:
            print(f"⚠️  API returned status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing API key: {e}")
        return False

def set_environment_variable(api_key):
    """Set the WEATHER_API_KEY environment variable"""
    # For current session
    os.environ['WEATHER_API_KEY'] = api_key
    
    # Suggest permanent setup
    print("\n📝 To make this permanent, add to your shell profile:")
    print(f"echo 'export WEATHER_API_KEY=\"{api_key}\"' >> ~/.bashrc")
    print("source ~/.bashrc")
    
    # Or for immediate use
    print(f"\n🚀 For immediate use, run:")
    print(f"export WEATHER_API_KEY=\"{api_key}\"")

def main():
    print("🌤️  Tomorrow.io Weather API Setup for FSH AgriConnect")
    print("=" * 50)
    
    current_key = os.environ.get('WEATHER_API_KEY', 'Not set')
    print(f"Current API key: {current_key}")
    
    if current_key and not current_key.startswith('your-'):
        print("\n🔍 Testing current API key...")
        if test_api_key(current_key):
            print("✅ Current API key is working! No changes needed.")
            return
    
    print("\n📋 Steps to get your API key:")
    print("1. Visit: https://www.tomorrow.io/")
    print("2. Sign up for a free account")
    print("3. Go to your dashboard")
    print("4. Copy your API key")
    
    api_key = input("\n🔑 Enter your Tomorrow.io API key (or press Enter to skip): ").strip()
    
    if not api_key:
        print("⏭️  Skipped. You can set it later with:")
        print("export WEATHER_API_KEY=\"your-api-key-here\"")
        return
    
    print(f"\n🔍 Testing API key: {api_key[:8]}...")
    
    if test_api_key(api_key):
        set_environment_variable(api_key)
        print("\n✅ Setup complete! Weather API should now work.")
        print("🔄 Restart your Flask server to use the new API key.")
    else:
        print("\n❌ API key test failed. Please check your key and try again.")

if __name__ == "__main__":
    main()