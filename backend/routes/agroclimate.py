# backend/routes/agroclimate.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.agroclimate import Region, WeatherData, CropRecommendation
from extensions import db
import requests
from datetime import date

agroclimate_bp = Blueprint('agroclimate', __name__)

@agroclimate_bp.route('/regions', methods=['GET'])
def get_regions():
    regions = Region.query.all()
    return jsonify({
        'regions': [region.to_dict() for region in regions]
    })

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
    
    # If no recent data, fetch from OpenWeatherMap API (CURRENT WEATHER)
    try:
        api_key = 'REPLACE_WITH_YOUR_REAL_OPENWEATHERMAP_API_KEY'  # <-- replace with real key
        city = region.name  # Assumes region.name is a valid city
        url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric'
        
        response = requests.get(url)
        if response.status_code != 200:
            return jsonify({
                'message': 'Failed to fetch weather data',
                'error': response.text
            }), 500
        
        weather_data = response.json()
        main = weather_data.get('main', {})
        wind = weather_data.get('wind', {})
        weather_desc = weather_data.get('weather', [{}])[0].get('description', '')
        
        parsed_weather = {
            'temperature': main.get('temp'),
            'humidity': main.get('humidity'),
            'rainfall': weather_data.get('rain', {}).get('1h', 0.0),  # rainfall in last 1 hour if available
            'wind_speed': wind.get('speed'),
            'wind_direction': wind.get('deg'),
            'weather_condition': weather_desc.title()
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
    identity = get_jwt_identity()
    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    recommendation = CropRecommendation(**data)
    db.session.add(recommendation)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop recommendation created successfully',
        'recommendation': recommendation.to_dict()
    }), 201
