#backend/models/agroclimate.py
from extensions import db
import datetime

class Region(db.Model):
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    altitude = db.Column(db.Float)
    soil_type = db.Column(db.String(100))
    average_rainfall = db.Column(db.Float)  # in mm
    
    # Relationships
    weather_data = db.relationship('WeatherData', backref='region', lazy=True)
    crop_recommendations = db.relationship('CropRecommendation', backref='region', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'soil_type': self.soil_type,
            'average_rainfall': self.average_rainfall
        }

class WeatherData(db.Model):
    __tablename__ = 'weather_data'
    
    id = db.Column(db.Integer, primary_key=True)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    temperature = db.Column(db.Float)  # in Celsius
    humidity = db.Column(db.Float)  # percentage
    rainfall = db.Column(db.Float)  # in mm
    wind_speed = db.Column(db.Float)  # in km/h
    wind_direction = db.Column(db.String(10))
    weather_condition = db.Column(db.String(50))  # sunny, cloudy, rainy, etc.
    
    def to_dict(self):
        return {
            'id': self.id,
            'region_id': self.region_id,
            'date': self.date.isoformat(),
            'temperature': self.temperature,
            'humidity': self.humidity,
            'rainfall': self.rainfall,
            'wind_speed': self.wind_speed,
            'wind_direction': self.wind_direction,
            'weather_condition': self.weather_condition
        }

class CropRecommendation(db.Model):
    __tablename__ = 'crop_recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    season = db.Column(db.String(50))  # rainy, dry, etc.
    planting_month = db.Column(db.String(20))
    harvesting_month = db.Column(db.String(20))
    expected_yield = db.Column(db.String(100))
    water_requirements = db.Column(db.String(100))
    soil_requirements = db.Column(db.String(100))
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'region_id': self.region_id,
            'crop_name': self.crop_name,
            'season': self.season,
            'planting_month': self.planting_month,
            'harvesting_month': self.harvesting_month,
            'expected_yield': self.expected_yield,
            'water_requirements': self.water_requirements,
            'soil_requirements': self.soil_requirements,
            'description': self.description
        }