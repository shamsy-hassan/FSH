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
    type = db.Column(db.String(20), default='product')  # product or need
    status = db.Column(db.String(20), default='active')  # active, closed, pending
    approved = db.Column(db.Boolean, default=False)  # admin approval for farmer posts
    priority = db.Column(db.String(20), default='normal')  # high, normal, low
    quality_grade = db.Column(db.String(10))  # A, B, C grade for products
    harvest_date = db.Column(db.Date)  # for crops
    expiry_date = db.Column(db.Date)  # for products with expiry
    accepted_by = db.Column(db.Integer, db.ForeignKey('users.id'))  # for needs
    view_count = db.Column(db.Integer, default=0)
    interest_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    images = db.relationship('MarketPostImage', backref='market_post', lazy=True, cascade='all, delete-orphan')
    interests = db.relationship('MarketInterest', backref='market_post', lazy=True, cascade='all, delete-orphan')
    accepter = db.relationship('User', foreign_keys=[accepted_by], backref='accepted_needs')
    
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
            'type': self.type,
            'status': self.status,
            'approved': self.approved,
            'priority': self.priority,
            'quality_grade': self.quality_grade,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'accepted_by': self.accepted_by,
            'accepter': self.accepter.to_dict() if self.accepter else None,
            'view_count': self.view_count,
            'interest_count': self.interest_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'images': [img.to_dict()['image_url'] for img in self.images if img.to_dict()['image_url']],
            'interests': [interest.to_dict() for interest in self.interests]
        }

class MarketPostImage(db.Model):
    __tablename__ = 'market_post_images'
    
    id = db.Column(db.Integer, primary_key=True)
    market_post_id = db.Column(db.Integer, db.ForeignKey('market_posts.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(200))
    
    def to_dict(self):
        return {
            'id': self.id,
            'market_post_id': self.market_post_id,
            'image_url': self.image_url,
            'caption': self.caption
        }

class MarketInterest(db.Model):
    __tablename__ = 'market_interests'
    
    id = db.Column(db.Integer, primary_key=True)
    market_post_id = db.Column(db.Integer, db.ForeignKey('market_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text)
    offer_price = db.Column(db.Float)
    offer_quantity = db.Column(db.Float)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='market_interests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'market_post_id': self.market_post_id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'message': self.message,
            'offer_price': self.offer_price,
            'offer_quantity': self.offer_quantity,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        # Create full URL for image if it exists
        image_url = None
        if self.image_url:
            if self.image_url.startswith('http'):
                image_url = self.image_url
            else:
                image_url = f'http://localhost:5000/static/uploads/{self.image_url}'
        
        return {
            'id': self.id,
            'market_post_id': self.market_post_id,
            'image_url': image_url,
            'caption': self.caption,
            'uploaded_at': self.uploaded_at.isoformat()
        }