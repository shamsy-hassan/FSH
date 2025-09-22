from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.profile import UserProfile
from models.user import User
from extensions import db
import os
from werkzeug.utils import secure_filename
import datetime

profile_bp = Blueprint('profile', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_user_profile():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    
    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else None
    })

@profile_bp.route('', methods=['POST'])
@jwt_required()
def create_user_profile():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    
    if user.profile:
        return jsonify({'message': 'Profile already exists'}), 400
    
    data = request.get_json()
    
    profile = UserProfile.create_profile_for_user(
        user_id=user_id,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    
    # Set optional fields
    if 'phone' in data:
        profile.phone = data['phone']
    if 'address' in data:
        profile.address = data['address']
    if 'region' in data:
        profile.region = data['region']
    if 'farm_size' in data:
        profile.farm_size = float(data['farm_size'])
    if 'date_of_birth' in data:
        profile.date_of_birth = datetime.datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    if 'gender' in data:
        profile.gender = data['gender']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile created successfully',
        'profile': profile.to_dict()
    })

@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_user_profile():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    profile = user.profile
    
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    data = request.form.to_dict()
    
    # Handle profile picture upload
    if 'profile_picture' in request.files:
        image = request.files['profile_picture']
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            upload_folder = 'uploads/profiles'
            os.makedirs(upload_folder, exist_ok=True)
            image_path = os.path.join(upload_folder, filename)
            image.save(image_path)
            profile.profile_picture = f'/{upload_folder}/{filename}'
    
    # Update profile fields
    for key, value in data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    
    profile.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'profile': profile.to_dict()
    })

@profile_bp.route('/picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    profile = user.profile
    
    if 'profile_picture' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    image = request.files['profile_picture']
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        upload_folder = 'uploads/profiles'
        os.makedirs(upload_folder, exist_ok=True)
        image_path = os.path.join(upload_folder, filename)
        image.save(image_path)
        
        if not profile:
            profile = UserProfile(user_id=user_id)
            profile.first_name = 'N/A'
            profile.last_name = 'N/A'
            db.session.add(profile)
        
        profile.profile_picture = f'/{upload_folder}/{filename}'
        profile.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_picture': profile.profile_picture
        })
    
    return jsonify({'message': 'Invalid file type'}), 400

@profile_bp.route('/picture', methods=['DELETE'])
@jwt_required()
def delete_profile_picture():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    profile = user.profile
    
    if not profile or not profile.profile_picture:
        return jsonify({'message': 'No profile picture found'}), 404
    
    # Delete file from disk
    image_path = os.path.join('uploads/profiles', profile.profile_picture.split('/')[-1])
    try:
        if os.path.exists(image_path):
            os.remove(image_path)
    except OSError:
        pass  # Continue even if file deletion fails
    
    profile.profile_picture = None
    profile.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Profile picture deleted successfully'})