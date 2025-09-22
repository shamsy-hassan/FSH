#backend/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.admin import Admin
from models.user import User
from models.profile import UserProfile
from extensions import db
from functools import wraps
import datetime

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity.get('type') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        admin_id = identity.get('id')
        admin = Admin.query.get(admin_id)
        if not admin or not admin.is_active:
            return jsonify({'message': 'Admin account inactive or not found'}), 401
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    # Get dashboard statistics
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_admins = Admin.query.count()
    active_admins = Admin.query.filter_by(is_active=True).count()
    
    # Recent users (last 7 days)
    recent_users = User.query.filter(
        User.created_at >= datetime.datetime.utcnow() - datetime.timedelta(days=7)
    ).count()
    
    return jsonify({
        'total_users': total_users,
        'active_users': active_users,
        'total_admins': total_admins,
        'active_admins': active_admins,
        'recent_users': recent_users,
        'stats': {
            'users': {'total': total_users, 'active': active_users},
            'admins': {'total': total_admins, 'active': active_admins}
        }
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    users = User.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': users.total,
            'pages': users.pages
        }
    })

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_single_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()})

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'user_type' in data:
        user.user_type = data['user_type']
    if 'is_verified' in data:
        user.is_verified = data['is_verified']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    })

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Don't actually delete, just deactivate
    user.is_active = False
    db.session.commit()
    
    return jsonify({
        'message': 'User deactivated successfully',
        'user': user.to_dict()
    })

@admin_bp.route('/admins', methods=['GET'])
@admin_required
def get_admins():
    admins = Admin.query.filter_by(is_active=True).all()
    return jsonify({
        'admins': [admin.to_dict() for admin in admins]
    })

@admin_bp.route('/profile', methods=['GET'])
@admin_required
def get_admin_profile():
    identity = get_jwt_identity()
    admin_id = identity.get('id')
    admin = Admin.query.get_or_404(admin_id)
    
    return jsonify({
        'admin': admin.to_dict()
    })