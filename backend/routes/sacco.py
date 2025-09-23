# backend/routes/sacco.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.sacco import Sacco, SaccoMember, Loan, LoanApplication
from extensions import db
from decimal import Decimal
import datetime
import random
import string
import json   # ✅ added

sacco_bp = Blueprint('sacco', __name__)


@sacco_bp.route('/saccos', methods=['GET'])
def get_saccos():
    region = request.args.get('region')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Sacco.query.filter_by(is_active=True)
    if region:
        query = query.filter_by(region=region)
    
    saccos = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'saccos': [sacco.to_dict() for sacco in saccos.items],
        'total': saccos.total,
        'pages': saccos.pages,
        'current_page': page
    })


@sacco_bp.route('/saccos/<int:sacco_id>', methods=['GET'])
def get_sacco(sacco_id):
    sacco = Sacco.query.get_or_404(sacco_id)
    return jsonify(sacco.to_dict())


@sacco_bp.route('/saccos/<int:sacco_id>/join', methods=['POST'])
@jwt_required()
def join_sacco(sacco_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    sacco = Sacco.query.get_or_404(sacco_id)
    
    # Check if user is already a member
    existing_member = SaccoMember.query.filter_by(
        user_id=user_id, 
        sacco_id=sacco_id
    ).first()
    
    if existing_member:
        return jsonify({'message': 'Already a member of this SACCO'}), 400
    
    # Generate membership ID
    membership_id = f"SAC-{sacco_id}-{user_id}-{datetime.datetime.now().strftime('%Y%m%d')}"
    
    # Create membership
    member = SaccoMember(
        user_id=user_id,
        sacco_id=sacco_id,
        membership_id=membership_id,
        join_date=datetime.date.today()
    )
    
    db.session.add(member)
    sacco.total_members += 1
    db.session.commit()
    
    return jsonify({
        'message': 'Successfully joined SACCO',
        'membership': member.to_dict()
    }), 201


@sacco_bp.route('/membership', methods=['GET'])
@jwt_required()
def get_membership():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    memberships = SaccoMember.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'memberships': [membership.to_dict() for membership in memberships]
    })


@sacco_bp.route('/loans', methods=['GET'])
def get_loans():
    sacco_id = request.args.get('sacco_id')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Loan.query.filter_by(is_active=True)
    if sacco_id:
        query = query.filter_by(sacco_id=sacco_id)
    
    loans = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'loans': [loan.to_dict() for loan in loans.items],
        'total': loans.total,
        'pages': loans.pages,
        'current_page': page
    })


@sacco_bp.route('/loan-applications', methods=['POST'])
@jwt_required()
def apply_for_loan():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    data = request.get_json()
    
    # Check if user is a member of the SACCO
    membership = SaccoMember.query.filter_by(
        user_id=user_id, 
        sacco_id=data['sacco_id']
    ).first()
    
    if not membership:
        return jsonify({'message': 'You must be a member of the SACCO to apply for a loan'}), 400
    
    # Create loan application
    application = LoanApplication(
        user_id=user_id,
        loan_id=data['loan_id'],
        amount=Decimal(data['amount']),
        purpose=data['purpose']
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'message': 'Loan application submitted successfully',
        'application': application.to_dict()
    }), 201


@sacco_bp.route('/loan-applications', methods=['GET'])
@jwt_required()
def get_loan_applications():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') == 'user':
        user_id = identity['id']
        applications = LoanApplication.query.filter_by(user_id=user_id).all()
    elif identity.get('type') == 'admin':
        sacco_id = request.args.get('sacco_id')
        if sacco_id:
            applications = LoanApplication.query.join(Loan).filter(Loan.sacco_id == sacco_id).all()
        else:
            applications = LoanApplication.query.all()
    else:
        return jsonify({'message': 'Invalid user type'}), 403
    
    return jsonify({

        'applications': [app.to_dict() for app in applications]
    })
