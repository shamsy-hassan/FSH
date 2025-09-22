#backend/models/market.py
from extensions import db
import datetime

class MarketPost(db.Model):
    __tablename__ = 'market_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float)
    quantity = db.Column(db.Float)  # in kg or units
    unit = db.Column(db.String(20))  # kg, unit, bag, etc.
    category = db.Column(db.String(100))  # crops, livestock, equipment, etc.
    location = db.Column(db.String(200))
    region = db.Column(db.String(100))
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    images = db.relationship('MarketPostImage', backref='market_post', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'quantity': self.quantity,
            'unit': self.unit,
            'category': self.category,
            'location': self.location,
            'region': self.region,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'images': [image.to_dict() for image in self.images]
        }

class MarketPostImage(db.Model):
    __tablename__ = 'market_post_images'
    
    id = db.Column(db.Integer, primary_key=True)
    market_post_id = db.Column(db.Integer, db.ForeignKey('market_posts.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(200))
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'market_post_id': self.market_post_id,
            'image_url': self.image_url,
            'caption': self.caption,
            'uploaded_at': self.uploaded_at.isoformat()
        }