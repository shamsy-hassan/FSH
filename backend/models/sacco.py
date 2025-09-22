# backend/models/sacco.py
from extensions import db
import datetime
from decimal import Decimal

class Sacco(db.Model):
    __tablename__ = 'saccos'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text)
    registration_number = db.Column(db.String(100), unique=True)
    location = db.Column(db.String(200))
    region = db.Column(db.String(100))
    founded_date = db.Column(db.Date)
    total_members = db.Column(db.Integer, default=0)
    total_assets = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    members = db.relationship('SaccoMember', backref='sacco', lazy=True)
    loans = db.relationship('Loan', backref='sacco', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'registration_number': self.registration_number,
            'location': self.location,
            'region': self.region,
            'founded_date': self.founded_date.isoformat() if self.founded_date else None,
            'total_members': self.total_members,
            'total_assets': float(self.total_assets) if self.total_assets else 0.0,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class SaccoMember(db.Model):
    __tablename__ = 'sacco_members'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sacco_id = db.Column(db.Integer, db.ForeignKey('saccos.id'), nullable=False)
    membership_id = db.Column(db.String(100), unique=True)
    join_date = db.Column(db.Date, default=datetime.date.today)
    membership_type = db.Column(db.String(50), default='regular')  # regular, executive, etc.
    shares = db.Column(db.Integer, default=0)
    savings = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'sacco_id': self.sacco_id,
            'sacco_name': self.sacco.name if self.sacco else None,
            'membership_id': self.membership_id,
            'join_date': self.join_date.isoformat() if self.join_date else None,
            'membership_type': self.membership_type,
            'shares': self.shares,
            'savings': float(self.savings) if self.savings else 0.0,
            'is_active': self.is_active
        }

class Loan(db.Model):
    __tablename__ = 'loans'
    
    id = db.Column(db.Integer, primary_key=True)
    sacco_id = db.Column(db.Integer, db.ForeignKey('saccos.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    interest_rate = db.Column(db.Float, nullable=False)  # annual interest rate
    max_amount = db.Column(db.Numeric(15, 2))
    min_amount = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    repayment_period = db.Column(db.Integer)  # in months
    requirements = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    applications = db.relationship('LoanApplication', backref='loan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sacco_id': self.sacco_id,
            'name': self.name,
            'description': self.description,
            'interest_rate': self.interest_rate,
            'max_amount': float(self.max_amount) if self.max_amount else None,
            'min_amount': float(self.min_amount) if self.min_amount else 0.0,
            'repayment_period': self.repayment_period,
            'requirements': self.requirements,
            'is_active': self.is_active
        }

class LoanApplication(db.Model):
    __tablename__ = 'loan_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    loan_id = db.Column(db.Integer, db.ForeignKey('loans.id'), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    purpose = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, disbursed
    application_date = db.Column(db.Date, default=datetime.date.today)
    approval_date = db.Column(db.Date)
    disbursement_date = db.Column(db.Date)
    repayment_start_date = db.Column(db.Date)
    repayment_end_date = db.Column(db.Date)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'loan_id': self.loan_id,
            'loan_name': self.loan.name if self.loan else None,
            'amount': float(self.amount) if self.amount else 0.0,
            'purpose': self.purpose,
            'status': self.status,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None,
            'disbursement_date': self.disbursement_date.isoformat() if self.disbursement_date else None,
            'repayment_start_date': self.repayment_start_date.isoformat() if self.repayment_start_date else None,
            'repayment_end_date': self.repayment_end_date.isoformat() if self.repayment_end_date else None
        }