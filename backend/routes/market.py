#backend/routes/market.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.market import MarketPost, MarketPostImage
from extensions import db
import datetime

import datetime

market_bp = Blueprint('market', __name__)

@market_bp.route('/posts', methods=['GET'])
def get_market_posts():
    category = request.args.get('category')
    region = request.args.get('region')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = MarketPost.query.filter_by(is_available=True)
    
    if category:
        query = query.filter_by(category=category)
    if region:
        query = query.filter_by(region=region)
    
    posts = query.order_by(MarketPost.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })

@market_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_market_post(post_id):
    post = MarketPost.query.get_or_404(post_id)
    return jsonify(post.to_dict())

@market_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_market_post():
    import json
    identity_raw = get_jwt_identity()
    identity = identity_raw if isinstance(identity_raw, dict) else json.loads(identity_raw)
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    user_id = identity['id']
    data = request.form.to_dict()

    # Handle file uploads
    images = request.files.getlist('images')
    image_urls = []

    import os
    UPLOAD_FOLDER = 'static/uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    for image in images:
        if image and allowed_file(image.filename):
            ext = image.filename.rsplit('.', 1)[1].lower()
            import uuid
            filename = f"{uuid.uuid4().hex}.{ext}"
            path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(path)
            image_urls.append(filename)

    # Create market post
    market_post = MarketPost(
        user_id=user_id,
        title=data['title'],
        description=data.get('description', ''),
        price=float(data.get('price', 0)),
        quantity=float(data.get('quantity', 0)),
        unit=data.get('unit', ''),
        category=data.get('category', ''),
        location=data.get('location', ''),
        region=data.get('region', '')
    )

    db.session.add(market_post)
    db.session.commit()

    # Add images
    for image_url in image_urls:
        post_image = MarketPostImage(
            market_post_id=market_post.id,
            image_url=image_url
        )
        db.session.add(post_image)

    db.session.commit()

    return jsonify({
        'message': 'Market post created successfully',
        'post': market_post.to_dict()
    }), 201

@market_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_market_post(post_id):
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    post = MarketPost.query.get_or_404(post_id)
    
    if post.user_id != user_id:
        return jsonify({'message': 'Not authorized to update this post'}), 403
    
    data = request.get_json()
    
    for key, value in data.items():
        if hasattr(post, key):
            setattr(post, key, value)
    
    post.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Market post updated successfully',
        'post': post.to_dict()
    })

@market_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_market_post(post_id):
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    post = MarketPost.query.get_or_404(post_id)
    
    if post.user_id != user_id:
        return jsonify({'message': 'Not authorized to delete this post'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Market post deleted successfully'})

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}