#backend/routes/market.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.market import MarketPost, MarketPostImage, MarketInterest
from extensions import db
import datetime
import json

market_bp = Blueprint('market', __name__)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@market_bp.route('/posts', methods=['GET'])
def get_market_posts():
    category = request.args.get('category')
    region = request.args.get('region')
    post_type = request.args.get('type')  # product or need
    status = request.args.get('status')
    user_type = request.args.get('user_type')  # farmer or admin
    approved_only = request.args.get('approved_only', 'false').lower() == 'true'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = MarketPost.query
    
    if category:
        query = query.filter_by(category=category)
    if region:
        query = query.filter_by(region=region)
    if post_type:
        query = query.filter_by(type=post_type)
    if status:
        query = query.filter_by(status=status)
    if approved_only:
        query = query.filter_by(approved=True)
    
    # Filter by user type if specified
    if user_type:
        from models.user import User
        user_ids = [u.id for u in User.query.filter_by(user_type=user_type).all()]
        query = query.filter(MarketPost.user_id.in_(user_ids))
    
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
    # Increment view count
    post.view_count += 1
    db.session.commit()
    return jsonify(post.to_dict())

@market_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_market_post():
    identity = json.loads(get_jwt_identity())
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

    # Parse dates if provided
    harvest_date = None
    expiry_date = None
    if data.get('harvest_date'):
        try:
            harvest_date = datetime.datetime.strptime(data['harvest_date'], '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if data.get('expiry_date'):
        try:
            expiry_date = datetime.datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    # Determine if post needs approval (farmer posts need approval, admin posts are auto-approved)
    from models.user import User
    user = User.query.get(user_id)
    approved = user.user_type == 'admin' if user else False

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
        region=data.get('region', ''),
        type=data.get('type', 'product'),
        status=data.get('status', 'active'),
        approved=approved,
        priority=data.get('priority', 'normal'),
        quality_grade=data.get('quality_grade', ''),
        harvest_date=harvest_date,
        expiry_date=expiry_date
    )

    db.session.add(market_post)
    db.session.flush()

    # Add images
    for image_url in image_urls:
        post_image = MarketPostImage(
            market_post_id=market_post.id,
            image_url=image_url
        )
        db.session.add(post_image)

    db.session.commit()
    return jsonify(market_post.to_dict()), 201

@market_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_market_post(post_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    user_id = identity['id']
    post = MarketPost.query.get_or_404(post_id)
    
    # Check if user owns the post or is admin
    from models.user import User
    user = User.query.get(user_id)
    if post.user_id != user_id and user.user_type != 'admin':
        return jsonify({'message': 'Permission denied'}), 403

    data = request.get_json()
    
    # Update fields
    for field in ['title', 'description', 'price', 'quantity', 'unit', 'category', 'location', 'region', 'type', 'status', 'priority', 'quality_grade']:
        if field in data:
            setattr(post, field, data[field])
    
    # Update dates
    if 'harvest_date' in data and data['harvest_date']:
        try:
            post.harvest_date = datetime.datetime.strptime(data['harvest_date'], '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if 'expiry_date' in data and data['expiry_date']:
        try:
            post.expiry_date = datetime.datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    post.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify(post.to_dict())

@market_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_market_post(post_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    user_id = identity['id']
    post = MarketPost.query.get_or_404(post_id)
    
    # Check if user owns the post or is admin
    from models.user import User
    user = User.query.get(user_id)
    if post.user_id != user_id and user.user_type != 'admin':
        return jsonify({'message': 'Permission denied'}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted successfully'})

@market_bp.route('/posts/<int:post_id>/approve', methods=['POST'])
@jwt_required()
def approve_market_post(post_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    post = MarketPost.query.get_or_404(post_id)
    post.approved = True
    db.session.commit()
    return jsonify(post.to_dict())

@market_bp.route('/posts/<int:post_id>/interest', methods=['POST'])
@jwt_required()
def express_interest(post_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    user_id = identity['id']
    data = request.get_json()
    
    # Get the post to validate
    post = MarketPost.query.get_or_404(post_id)
    
    # Prevent users from expressing interest in their own posts
    if post.user_id == user_id:
        return jsonify({'message': 'Cannot express interest in your own post'}), 400
    
    # Check if post is available for interest
    if post.status != 'active':
        return jsonify({'message': 'Post is not available for interest'}), 400
    
    # Check if user already expressed interest
    existing_interest = MarketInterest.query.filter_by(
        market_post_id=post_id, user_id=user_id
    ).first()
    
    if existing_interest:
        return jsonify({'message': 'Interest already expressed'}), 400

    interest = MarketInterest(
        market_post_id=post_id,
        user_id=user_id,
        message=data.get('message', ''),
        offer_price=data.get('offer_price'),
        offer_quantity=data.get('offer_quantity')
    )
    
    db.session.add(interest)
    
    # Update interest count on post
    if post:
        post.interest_count += 1
    
    db.session.commit()
    return jsonify(interest.to_dict()), 201

@market_bp.route('/posts/<int:post_id>/interests', methods=['GET'])
@jwt_required()
def get_post_interests(post_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    interests = MarketInterest.query.filter_by(market_post_id=post_id).all()
    return jsonify([interest.to_dict() for interest in interests])

@market_bp.route('/interests/<int:interest_id>/accept', methods=['POST'])
@jwt_required()
def accept_interest(interest_id):
    identity = json.loads(get_jwt_identity())
    if identity.get('type') not in ['user', 'admin']:
        return jsonify({'message': 'User or admin access required'}), 403

    user_id = identity['id']
    interest = MarketInterest.query.get_or_404(interest_id)
    post = interest.market_post
    
    # Check if user owns the post or is admin
    if post.user_id != user_id and identity.get('type') != 'admin':
        return jsonify({'message': 'Permission denied'}), 403
    
    # Check if post is still active
    if post.status != 'active':
        return jsonify({'message': 'Cannot accept interest on inactive post'}), 400
    
    # Check if interest is still pending
    if interest.status != 'pending':
        return jsonify({'message': 'Interest has already been processed'}), 400

    interest.status = 'accepted'
    
    # If it's a need, mark as accepted by this user
    if post.type == 'need':
        post.accepted_by = interest.user_id
        post.status = 'closed'
    
    db.session.commit()
    return jsonify(interest.to_dict())

@market_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_market_stats():
    identity = json.loads(get_jwt_identity())
    
    user_id = identity['id']
    is_admin = identity.get('type') == 'admin'
    
    if is_admin:
        # Admin stats
        total_posts = MarketPost.query.count()
        pending_approvals = MarketPost.query.filter_by(approved=False).count()
        active_posts = MarketPost.query.filter_by(status='active').count()
        total_interests = MarketInterest.query.count()
        
        return jsonify({
            'total_posts': total_posts,
            'pending_approvals': pending_approvals,
            'active_posts': active_posts,
            'total_interests': total_interests
        })
    else:
        # User stats
        user_posts = MarketPost.query.filter_by(user_id=user_id).count()
        active_user_posts = MarketPost.query.filter_by(user_id=user_id, status='active').count()
        user_interests = MarketInterest.query.filter_by(user_id=user_id).count()
        accepted_interests = MarketInterest.query.filter_by(user_id=user_id, status='accepted').count()
        
        return jsonify({
            'user_posts': user_posts,
            'active_user_posts': active_user_posts,
            'user_interests': user_interests,
            'accepted_interests': accepted_interests
        })