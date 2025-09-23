#backend/routes/skill.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.skill import SkillCategory, Skill, SkillVideo
from extensions import db

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
    import json
    identity_raw = get_jwt_identity()
    identity = identity_raw if isinstance(identity_raw, dict) else json.loads(identity_raw)
    if identity.get('type') != 'admin':
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
    identity = get_jwt_identity()
    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    video = SkillVideo(**data)
    db.session.add(video)
    db.session.commit()
    
    return jsonify({
        'message': 'Video added successfully',
        'video': video.to_dict()
    }), 201