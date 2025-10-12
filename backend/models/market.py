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
    organic_certified = db.Column(db.Boolean, default=False)  # organic certification
    min_order_quantity = db.Column(db.Float, default=1)  # minimum order quantity
    delivery_available = db.Column(db.Boolean, default=False)  # delivery option
    tags = db.Column(db.Text)  # searchable tags
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
            'name': self.title,  # Add name field for frontend compatibility
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
            'qualityGrade': self.quality_grade,  # Add camelCase for frontend compatibility
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'harvestDate': self.harvest_date.isoformat() if self.harvest_date else None,  # Add camelCase for frontend compatibility
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'accepted_by': self.accepted_by,
            'accepter': self.accepter.to_dict() if self.accepter else None,
            'view_count': self.view_count,
            'interest_count': self.interest_count,
            'organic_certified': self.organic_certified,
            'min_order_quantity': self.min_order_quantity,
            'delivery_available': self.delivery_available,
            'tags': self.tags,
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

class MarketInterest(db.Model):
    __tablename__ = 'market_interests'
    
    id = db.Column(db.Integer, primary_key=True)
    market_post_id = db.Column(db.Integer, db.ForeignKey('market_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text)
    offer_price = db.Column(db.Float)
    offer_quantity = db.Column(db.Float)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined
    admin_requested = db.Column(db.Boolean, default=False)  # Flag for admin requests
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
            'admin_requested': self.admin_requested,
            'created_at': self.created_at.isoformat()
        }


class ProductRequest(db.Model):
    __tablename__ = 'product_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('market_posts.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    farmer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quantity_requested = db.Column(db.Float, nullable=False)
    price_offered = db.Column(db.Float)
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, completed
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    
    # Relationships
    product = db.relationship('MarketPost', backref='requests')
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='sent_requests')
    farmer = db.relationship('User', foreign_keys=[farmer_id], backref='received_requests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'buyer_id': self.buyer_id,
            'buyer': self.buyer.to_dict() if self.buyer else None,
            'farmer_id': self.farmer_id,
            'farmer': self.farmer.to_dict() if self.farmer else None,
            'quantity_requested': self.quantity_requested,
            'price_offered': self.price_offered,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None
        }


class DeliveryDetails(db.Model):
    __tablename__ = 'delivery_details'
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('product_requests.id'), nullable=False)
    pickup_date = db.Column(db.Date)
    delivery_date = db.Column(db.Date)
    pickup_address = db.Column(db.Text)
    delivery_address = db.Column(db.Text)
    contact_phone = db.Column(db.String(20))
    special_instructions = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, picked_up, in_transit, delivered
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationship
    request = db.relationship('ProductRequest', backref='delivery_details')
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'pickup_date': self.pickup_date.isoformat() if self.pickup_date else None,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'pickup_address': self.pickup_address,
            'delivery_address': self.delivery_address,
            'contact_phone': self.contact_phone,
            'special_instructions': self.special_instructions,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class MarketNotification(db.Model):
    __tablename__ = 'market_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # market_gap, buyer_request, price_alert
    region = db.Column(db.String(100))
    product_needed = db.Column(db.String(100))
    quantity = db.Column(db.String(50))
    price_range = db.Column(db.String(50))
    exact_location = db.Column(db.String(200))
    urgency = db.Column(db.String(20), default='medium')  # high, medium, low
    expiry_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')  # active, expired, fulfilled
    views = db.Column(db.Integer, default=0)
    responses = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    admin = db.relationship('User', backref='market_notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'type': self.type,
            'region': self.region,
            'product_needed': self.product_needed,
            'productNeeded': self.product_needed,  # Frontend compatibility
            'quantity': self.quantity,
            'price_range': self.price_range,
            'priceRange': self.price_range,  # Frontend compatibility
            'exact_location': self.exact_location,
            'exactLocation': self.exact_location,  # Frontend compatibility
            'urgency': self.urgency,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'expiryDate': self.expiry_date.isoformat() if self.expiry_date else None,  # Frontend compatibility
            'status': self.status,
            'views': self.views,
            'responses': self.responses,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'timestamp': self.created_at.isoformat() if self.created_at else None,  # Frontend compatibility
            'admin': self.admin.to_dict() if self.admin else None
        }


class MarketDemand(db.Model):
    __tablename__ = 'market_demands'
    
    id = db.Column(db.Integer, primary_key=True)
    crop_name = db.Column(db.String(100), nullable=False)
    quantity_needed = db.Column(db.Float, nullable=False)
    price_range = db.Column(db.String(50))
    region = db.Column(db.String(100), nullable=False)
    buyer_info = db.Column(db.String(200))
    urgency = db.Column(db.String(20), default='medium')  # high, medium, low
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'crop_name': self.crop_name,
            'quantity_needed': self.quantity_needed,
            'price_range': self.price_range,
            'region': self.region,
            'buyer_info': self.buyer_info,
            'urgency': self.urgency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active
        }