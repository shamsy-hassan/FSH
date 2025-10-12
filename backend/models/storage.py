#backend/models/storage.py
from extensions import db
import datetime
from decimal import Decimal

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Float, nullable=False)  # in tons
    available_capacity = db.Column(db.Float, nullable=False)  # in tons
    temperature_control = db.Column(db.Boolean, default=False)
    humidity_control = db.Column(db.Boolean, default=False)
    security_level = db.Column(db.String(50), default='standard')  # standard, enhanced, maximum
    owner = db.Column(db.String(200))  # company or individual name
    contact_info = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    rates = db.Column(db.Text)  # JSON string of storage rates
    image_path = db.Column(db.String(500))  # Path to warehouse image
    description = db.Column(db.Text)  # Warehouse description
    
    # Relationships
    storage_requests = db.relationship('StorageRequest', backref='warehouse', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'region': self.region,
            'capacity': self.capacity,
            'available_capacity': self.available_capacity,
            'temperature_control': self.temperature_control,
            'humidity_control': self.humidity_control,
            'security_level': self.security_level,
            'owner': self.owner,
            'contact_info': self.contact_info,
            'is_active': self.is_active,
            'rates': self.rates,
            'image_path': self.image_path,
            'description': self.description
        }

class StorageRequest(db.Model):
    __tablename__ = 'storage_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    product_type = db.Column(db.String(100), nullable=False)  # grains, fruits, vegetables, etc.
    quantity = db.Column(db.Float, nullable=False)  # in tons
    duration = db.Column(db.Integer, nullable=False)  # in days
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    special_requirements = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, completed
    requested_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    total_cost = db.Column(db.Numeric(15, 2))
    
    # Relationships
    transactions = db.relationship('StorageTransaction', backref='storage_request', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'warehouse_id': self.warehouse_id,
            'warehouse_name': self.warehouse.name if self.warehouse else None,
            'product_type': self.product_type,
            'quantity': self.quantity,
            'duration': self.duration,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'special_requirements': self.special_requirements,
            'status': self.status,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'total_cost': float(self.total_cost) if self.total_cost else 0.0
        }

class StorageTransaction(db.Model):
    __tablename__ = 'storage_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    storage_request_id = db.Column(db.Integer, db.ForeignKey('storage_requests.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # deposit, withdrawal, payment
    amount = db.Column(db.Numeric(15, 2))
    description = db.Column(db.Text)
    transaction_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    recorded_by = db.Column(db.String(100))  # staff username or system
    
    def to_dict(self):
        return {
            'id': self.id,
            'storage_request_id': self.storage_request_id,
            'transaction_type': self.transaction_type,
            'amount': float(self.amount) if self.amount else 0.0,
            'description': self.description,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'recorded_by': self.recorded_by
        }