# backend/routes/agroclimate.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.agroclimate import Region, WeatherData, CropRecommendation
from extensions import db
import requests
import json
from datetime import date

agroclimate_bp = Blueprint('agroclimate', __name__)

def _get_weather_condition(weather_code):
    """Convert Tomorrow.io weather code to readable condition"""
    weather_codes = {
        0: 'Unknown',
        1000: 'Clear',
        1001: 'Cloudy',
        1100: 'Mostly Clear',
        1101: 'Partly Cloudy',
        1102: 'Mostly Cloudy',
        2000: 'Fog',
        2100: 'Light Fog',
        3000: 'Light Wind',
        3001: 'Wind',
        3002: 'Strong Wind',
        4000: 'Drizzle',
        4001: 'Rain',
        4200: 'Light Rain',
        4201: 'Heavy Rain',
        5000: 'Snow',
        5001: 'Flurries',
        5100: 'Light Snow',
        5101: 'Heavy Snow',
        6000: 'Freezing Drizzle',
        6001: 'Freezing Rain',
        6200: 'Light Freezing Rain',
        6201: 'Heavy Freezing Rain',
        7000: 'Ice Pellets',
        7101: 'Heavy Ice Pellets',
        7102: 'Light Ice Pellets',
        8000: 'Thunderstorm'
    }
    return weather_codes.get(weather_code, 'Unknown')

@agroclimate_bp.route('/regions', methods=['GET'])
def get_regions():
    try:
        regions = Region.query.all()
        
        region_dicts = []
        for region in regions:
            try:
                region_dict = region.to_dict()
                region_dicts.append(region_dict)
            except Exception as e:
                print(f"ERROR: Error converting region {region.name} to dict: {e}")
        
        result = {
            'regions': region_dicts
        }
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
    
    # If no recent data, fetch from Tomorrow.io
    try:
        from config import Config
        API_KEY = Config.WEATHER_API_KEY
        
        # Check if API key is configured
        if (API_KEY == "your-weatherapi-key-here" or 
            API_KEY == "your-actual-api-key-here" or 
            API_KEY == "your-tomorrow-io-api-key-here" or
            not API_KEY or 
            API_KEY == "your-weather-api-key-if-available"):
            
            return jsonify({
                'message': 'Weather API key not configured. Please set WEATHER_API_KEY environment variable.',
                'error': 'API key required for weather data'
            }), 503
        
        # Tomorrow.io realtime weather endpoint
        base_url = f"https://api.tomorrow.io/v4/weather/realtime"
        params = {
            'location': f"{region.latitude},{region.longitude}",
            'units': 'metric',
            'apikey': API_KEY
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                'message': 'Failed to fetch weather data from Tomorrow.io',
                'error': response.text,
                'status_code': response.status_code
            }), 502
        
        weather_data = response.json()
        
        # Extract data from Tomorrow.io response structure
        data = weather_data.get('data', {})
        values = data.get('values', {})
        
        parsed_weather = {
            'temperature': values.get('temperature', 0),
            'humidity': values.get('humidity', 0), 
            'rainfall': values.get('precipitationIntensity', 0.0),
            'wind_speed': values.get('windSpeed', 0),
            'wind_direction': values.get('windDirection', 0),
            'weather_condition': _get_weather_condition(values.get('weatherCode', 0))
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
    
    except requests.exceptions.Timeout:
        return jsonify({
            'message': 'Weather service request timed out',
            'error': 'Tomorrow.io weather service is currently unavailable'
        }), 504
    except requests.exceptions.ConnectionError:
        return jsonify({
            'message': 'Unable to connect to weather service',
            'error': 'Tomorrow.io weather service is currently unavailable'
        }), 503
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

@agroclimate_bp.route('/crop-recommendations/<int:recommendation_id>', methods=['DELETE'])
@jwt_required()
def delete_crop_recommendation(recommendation_id):
    identity = json.loads(get_jwt_identity())
    if identity['type'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    recommendation = CropRecommendation.query.get_or_404(recommendation_id)
    db.session.delete(recommendation)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop recommendation deleted successfully'
    }), 200
