#backend/routes/skill.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.skill import SkillCategory, Skill, SkillVideo
from extensions import db
import json

skill_bp = Blueprint('skill', __name__)

@skill_bp.route('/categories', methods=['GET'])
def get_skill_categories():
    categories = SkillCategory.query.all()
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    })

@skill_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_skill_category(category_id):
    category = SkillCategory.query.get_or_404(category_id)
    return jsonify(category.to_dict())

@skill_bp.route('/skills', methods=['GET'])
def get_skills():
    category_id = request.args.get('category_id')
    difficulty = request.args.get('difficulty')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Skill.query.filter_by(is_active=True)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    
    skills = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'skills': [skill.to_dict() for skill in skills.items],
        'total': skills.total,
        'pages': skills.pages,
        'current_page': page
    })

@skill_bp.route('/skills/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    return jsonify(skill.to_dict())

@skill_bp.route('/skills', methods=['POST'])
@jwt_required()
def create_skill():
    identity = json.loads(get_jwt_identity())
    if identity['type'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    skill = Skill(**data)
    db.session.add(skill)
    db.session.commit()
    
    return jsonify({
        'message': 'Skill created successfully',
        'skill': skill.to_dict()
    }), 201

@skill_bp.route('/videos', methods=['POST'])
@jwt_required()
def add_skill_video():
    identity = json.loads(get_jwt_identity())
    if identity['type'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    print("DEBUG: Content type:", request.content_type)
    print("DEBUG: Form data:", dict(request.form))
    print("DEBUG: Files:", list(request.files.keys()))
    
    # Handle both JSON and FormData
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Handle FormData (for file uploads)
        data = {}
        
        # Get form fields
        skill_id_raw = request.form.get('skill_id', '').strip()
        data['skill_id'] = int(skill_id_raw) if skill_id_raw and skill_id_raw != '' else None
        data['title'] = request.form.get('title', '').strip()
        data['description'] = request.form.get('description', '').strip()
        data['is_active'] = request.form.get('is_active', '1') == '1'
        data['thumbnail_url'] = request.form.get('thumbnail_url', '').strip()
        
        duration_raw = request.form.get('duration', '').strip()
        data['duration'] = int(duration_raw) if duration_raw and duration_raw != '' else None
        
        print("DEBUG: Parsed data:", data)
        
        # Handle video file upload
        if 'video_file' in request.files:
            video_file = request.files['video_file']
            if video_file and video_file.filename:
                from werkzeug.utils import secure_filename
                from extensions import allowed_file
                import uuid
                import os
                
                if not allowed_file(video_file.filename):
                    return jsonify({'error': 'Invalid file type'}), 400
                
                # Generate unique filename
                file_extension = os.path.splitext(video_file.filename)[1]
                filename = str(uuid.uuid4().hex) + file_extension
                
                # Save file
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(os.path.dirname(upload_path), exist_ok=True)
                video_file.save(upload_path)
                
                # Set video_url to the file path
                data['video_url'] = f'/static/uploads/{filename}'
                print("DEBUG: File uploaded to:", data['video_url'])
        else:
            # Use provided URL
            data['video_url'] = request.form.get('video_url', '').strip()
            print("DEBUG: Using URL:", data['video_url'])
        
    else:
        # Handle JSON data
        data = request.get_json()
        print("DEBUG: JSON data:", data)
    
    # Validate required fields
    if not data.get('skill_id'):
        return jsonify({'error': 'skill_id is required'}), 400
    if not data.get('title'):
        return jsonify({'error': 'title is required'}), 400
    if not data.get('video_url'):
        return jsonify({'error': 'video_url or video_file is required'}), 400
    
    print("DEBUG: Final data for SkillVideo:", data)
    
    try:
        video = SkillVideo(**data)
        print("DEBUG: SkillVideo object created successfully")
        db.session.add(video)
        print("DEBUG: Video added to session")
        db.session.commit()
        print("DEBUG: Database commit successful")
        
        video_dict = video.to_dict()
        print("DEBUG: Video dict:", video_dict)
        
        return jsonify({
            'message': 'Video added successfully',
            'video': video_dict
        }), 201
    except Exception as e:
        print("DEBUG: Error during video creation:", str(e))
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500