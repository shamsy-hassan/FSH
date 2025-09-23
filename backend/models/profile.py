#backend/models/profile.py
from extensions import db
import datetime

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    region = db.Column(db.String(100))
    farm_size = db.Column(db.Float)  # in acres
    profile_picture = db.Column(db.String(255))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(10))
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_user_profiles_user_id', 'user_id'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'address': self.address,
            'region': self.region,
            'farm_size': self.farm_size,
            'profile_picture': self.profile_picture,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_profile_for_user(cls, user_id, first_name, last_name):
        """Helper method to create a profile for a new user"""
        profile = cls(
            user_id=user_id,
            first_name=first_name,
            last_name=last_name
        )
        db.session.add(profile)
        return profile