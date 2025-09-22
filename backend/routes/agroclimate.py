#backend/routes/agroclimate.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.agroclimate import Region, WeatherData, CropRecommendation
from extensions import db
import requests
from datetime import datetime, date

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
    
    # Check if we have recent weather data (within last 6 hours)
    recent_weather = WeatherData.query.filter(
        WeatherData.region_id == region_id,
        WeatherData.date == date.today()
    ).first()
    
    if recent_weather:
        return jsonify(recent_weather.to_dict())
    
    # If no recent data, fetch from weather API (pseudo-code)
    try:
        # This would be replaced with actual API call to weather service
        # api_key = current_app.config['WEATHER_API_KEY']
        # response = requests.get(f'https://api.weatherapi.com/v1/current.json?key={api_key}&q={region.latitude},{region.longitude}')
        # weather_data = response.json()
        
        # Mock weather data for demonstration
        mock_weather = {
            'temperature': 25.5,
            'humidity': 65,
            'rainfall': 0.0,
            'wind_speed': 12.3,
            'wind_direction': 'NE',
            'weather_condition': 'Partly Cloudy'
        }
        
        # Save to database
        new_weather = WeatherData(
            region_id=region_id,
            date=date.today(),
            **mock_weather
        )
        db.session.add(new_weather)
        db.session.commit()
        
        return jsonify(new_weather.to_dict())
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch weather data', 'error': str(e)}), 500

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