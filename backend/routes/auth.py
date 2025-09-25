#backend/routes/auth.py
from flask import Blueprint, request, jsonify
from models.user import User
from models.profile import UserProfile
from models.admin import Admin
from extensions import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if data is nested with user and profile
        if 'user' in data and 'profile' in data:
            user_data = data['user']
            profile_data = data['profile']
        else:
            # Fallback to flat structure for backward compatibility
            user_data = data
            profile_data = data
        
        # Validate required user fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not user_data.get(field):
                return jsonify({'error': f'{field.capitalize()} is required'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=user_data.get('username')).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=user_data.get('email')).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user - SET is_verified=True for development
        new_user = User(
            username=user_data.get('username'),
            email=user_data.get('email'),
            user_type=user_data.get('user_type', 'farmer'),
            is_verified=True  # Set to True for development
        )
        new_user.set_password(user_data.get('password'))
        
        db.session.add(new_user)
        db.session.flush()  # Flush to get the user ID
        
        # Create user profile
        profile = UserProfile(
            user_id=new_user.id,
            first_name=profile_data.get('first_name', ''),
            last_name=profile_data.get('last_name', ''),
            phone=profile_data.get('phone'),
            address=profile_data.get('address'),
            region=profile_data.get('region'),
            farm_size=profile_data.get('farm_size'),
            gender=profile_data.get('gender')
        )
        
        db.session.add(profile)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # First try to authenticate as regular user
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            if not user.is_active:
                return jsonify({'error': 'Account is deactivated'}), 401
            
            # Create access token for user
            import json
            access_token = create_access_token(
                identity=json.dumps({'id': user.id, 'type': 'user'}),
                additional_claims={
                    'type': 'user',
                    'username': user.username,
                    'user_type': user.user_type,
                    'is_verified': user.is_verified
                }
            )
            
            return jsonify({
                'access_token': access_token,
                'user_type': user.user_type,
                'user': user.to_dict(),
                'type': 'user',
                'success': True
            }), 200
        
        # If not a user, try to authenticate as admin
        admin = Admin.query.filter_by(username=username).first()
        
        if admin and admin.check_password(password):
            if not admin.is_active:
                return jsonify({'error': 'Admin account is deactivated'}), 401
            
            # Create access token for admin
            import json
            access_token = create_access_token(
                identity=json.dumps({'id': admin.id, 'type': 'admin'}),
                additional_claims={
                    'type': 'admin',
                    'username': admin.username,
                    'role': admin.role,
                    'email': admin.email
                }
            )
            
            return jsonify({
                'access_token': access_token,
                'user_type': 'admin',
                'admin': admin.to_dict(),
                'type': 'admin',
                'success': True
            }), 200
        
        # Neither user nor admin found with valid credentials
        return jsonify({'error': 'Invalid username or password'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        import json
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        if user_type == 'user':
            user_id = identity.get('id')
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            profile_data = user.to_dict()
            if user.profile:
                profile_data['profile'] = user.profile.to_dict()
            return jsonify({
                'type': 'user',
                'user': profile_data
            }), 200
        elif user_type == 'admin':
            admin_id = identity.get('id')
            admin = Admin.query.get(admin_id)
            if not admin:
                return jsonify({'error': 'Admin not found'}), 404
            return jsonify({
                'type': 'admin',
                'admin': admin.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid user type'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logout successful'}), 200