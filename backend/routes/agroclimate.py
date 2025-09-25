# backend/routes/agroclimate.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.agroclimate import Region, WeatherData, CropRecommendation
from extensions import db
import requests
import json
from datetime import date

agroclimate_bp = Blueprint('agroclimate', __name__)

@agroclimate_bp.route('/regions', methods=['GET'])
def get_regions():
    try:
        print("DEBUG: Starting get_regions request")
        print(f"DEBUG: Database URI: {db.engine.url}")
        
        regions = Region.query.all()
        print(f"DEBUG: Found {len(regions)} regions in API call")
        
        for region in regions:
            print(f"DEBUG: Region {region.name} - {region.id} - lat:{region.latitude}, lon:{region.longitude}")
        
        region_dicts = []
        for region in regions:
            try:
                region_dict = region.to_dict()
                region_dicts.append(region_dict)
                print(f"DEBUG: Successfully converted region {region.name} to dict")
            except Exception as e:
                print(f"DEBUG: Error converting region {region.name} to dict: {e}")
        
        result = {
            'regions': region_dicts
        }
        print(f"DEBUG: Returning response: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"ERROR in get_regions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'regions': []}), 500

@agroclimate_bp.route('/regions/<int:region_id>', methods=['GET'])
def get_region(region_id):
    region = Region.query.get_or_404(region_id)
    return jsonify(region.to_dict())

@agroclimate_bp.route('/weather/<int:region_id>', methods=['GET'])
def get_weather(region_id):
    region = Region.query.get_or_404(region_id)
    
    # Check if we have recent weather data (today)
    recent_weather = WeatherData.query.filter(
        WeatherData.region_id == region_id,
        WeatherData.date == date.today()
    ).first()
    
    if recent_weather:
        return jsonify(recent_weather.to_dict())
    
    # If no recent data, fetch from WeatherAPI.com
    try:
        from config import Config
        API_KEY = Config.WEATHER_API_KEY
        
        # Use WeatherAPI.com for better debugging and more reliable data
        if API_KEY == "your-weatherapi-key-here":
            # Return mock weather data for testing when no API key is configured
            print("DEBUG: Using mock weather data (no WeatherAPI key configured)")
            parsed_weather = {
                'temperature': 25.5,
                'humidity': 65,
                'rainfall': 0.2,
                'wind_speed': 3.5,
                'wind_direction': 180,
                'weather_condition': 'Partly Cloudy'
            }
        else:
            # WeatherAPI.com current weather endpoint
            base_url = f"http://api.weatherapi.com/v1/current.json?key={API_KEY}&q={region.latitude},{region.longitude}&aqi=no"
            
            print(f"DEBUG: Fetching weather from WeatherAPI: {base_url}")
            response = requests.get(base_url)
            
            if response.status_code != 200:
                print(f"DEBUG: WeatherAPI request failed with status {response.status_code}: {response.text}")
                return jsonify({
                    'message': 'Failed to fetch weather data from WeatherAPI',
                    'error': response.text,
                    'status_code': response.status_code
                }), 500
            
            weather_data = response.json()
            print(f"DEBUG: WeatherAPI response: {weather_data}")
            
            current = weather_data.get('current', {})
            condition = current.get('condition', {})
            
            parsed_weather = {
                'temperature': current.get('temp_c', 0),
                'humidity': current.get('humidity', 0), 
                'rainfall': current.get('precip_mm', 0.0),
                'wind_speed': current.get('wind_kph', 0) / 3.6,  # Convert km/h to m/s
                'wind_direction': current.get('wind_degree', 0),
                'weather_condition': condition.get('text', 'Unknown')
            }
        
        # Save to database
        new_weather = WeatherData(
            region_id=region_id,
            date=date.today(),
            **parsed_weather
        )
        db.session.add(new_weather)
        db.session.commit()
        
        return jsonify(new_weather.to_dict())
    
    except Exception as e:
        return jsonify({
            'message': 'Failed to fetch weather data',
            'error': str(e)
        }), 500

@agroclimate_bp.route('/crop-recommendations/<int:region_id>', methods=['GET'])
def get_crop_recommendations(region_id):
    region = Region.query.get_or_404(region_id)
    season = request.args.get('season')
    
    query = CropRecommendation.query.filter_by(region_id=region_id)
    if season:
        query = query.filter_by(season=season)
    
    recommendations = query.all()
    return jsonify({
        'recommendations': [rec.to_dict() for rec in recommendations]
    })

@agroclimate_bp.route('/crop-recommendations', methods=['POST'])
@jwt_required()
def create_crop_recommendation():
    identity = json.loads(get_jwt_identity())
    if identity['type'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    recommendation = CropRecommendation(**data)
    db.session.add(recommendation)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop recommendation created successfully',
        'recommendation': recommendation.to_dict()
    }), 201
