# backend/routes/market.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.market import MarketPost, MarketPostImage, MarketInterest
from models.user import User
from models.order import Order
from extensions import db
import datetime
import json
import os
import uuid
from werkzeug.utils import secure_filename

market_bp = Blueprint('market', __name__)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """Save uploaded file and return filename"""
    if file and allowed_file(file.filename):
        # Check file size
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        
        if file_length > MAX_FILE_SIZE:
            return None, "File size too large"
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        
        file.save(path)
        return filename, None
    return None, "Invalid file type"

@market_bp.route('/posts', methods=['GET'])
def get_market_posts():
    try:
        # Query parameters
        category = request.args.get('category')
        region = request.args.get('region')
        post_type = request.args.get('type')  # product or need
        status = request.args.get('status')
        user_type = request.args.get('user_type')  # farmer, agent, admin
        approved_only = request.args.get('approved_only', 'false').lower() == 'true'
        user_id = request.args.get('user_id', type=int)
        search = request.args.get('search')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        quality_grade = request.args.get('quality_grade')
        organic_only = request.args.get('organic_only', 'false').lower() == 'true'
        delivery_available = request.args.get('delivery_available')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, price, view_count, interest_count
        sort_order = request.args.get('sort_order', 'desc')  # asc, desc
        
        query = MarketPost.query
        
        # Apply filters
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
        if user_id:
            query = query.filter_by(user_id=user_id)
        if quality_grade:
            query = query.filter_by(quality_grade=quality_grade)
        if organic_only:
            query = query.filter_by(organic_certified=True)
        if delivery_available:
            query = query.filter_by(delivery_available=(delivery_available.lower() == 'true'))
        
        # Price range filter
        if min_price is not None:
            query = query.filter(MarketPost.price >= min_price)
        if max_price is not None:
            query = query.filter(MarketPost.price <= max_price)
        
        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    MarketPost.title.ilike(search_term),
                    MarketPost.description.ilike(search_term),
                    MarketPost.tags.ilike(search_term)
                )
            )
        
        # Filter by user type if specified
        if user_type:
            from models.user import User
            user_ids = [u.id for u in User.query.filter_by(user_type=user_type).all()]
            query = query.filter(MarketPost.user_id.in_(user_ids))
        
        # Apply sorting
        sort_column = getattr(MarketPost, sort_by, MarketPost.created_at)
        if sort_order.lower() == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Pagination
        posts = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'posts': [post.to_dict() for post in posts.items],
            'total': posts.total,
            'pages': posts.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/needs', methods=['GET'])
def get_market_needs():
    """
    Dedicated endpoint for fetching admin-created market needs.
    These are always visible to all users and represent market demands.
    """
    try:
        category = request.args.get('category')
        region = request.args.get('region')
        status = request.args.get('status', 'active')  # Default to active needs
        priority = request.args.get('priority')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        from models.user import User
        
        # Get all admin users
        admin_users = User.query.filter_by(user_type='admin').all()
        admin_user_ids = [user.id for user in admin_users]
        
        # Query for admin-created needs only
        query = MarketPost.query.filter(
            MarketPost.user_id.in_(admin_user_ids),
            MarketPost.type == 'need',
            MarketPost.approved == True  # Admin posts are auto-approved
        )
        
        if category:
            query = query.filter_by(category=category)
        if region:
            query = query.filter_by(region=region)
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        
        needs = query.order_by(
            db.case(
                (MarketPost.priority == 'high', 1),
                (MarketPost.priority == 'normal', 2),
                (MarketPost.priority == 'low', 3),
                else_=4
            ),
            MarketPost.created_at.desc()
        ).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'needs': [need.to_dict() for need in needs.items],
            'total': needs.total,
            'pages': needs.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_market_post(post_id):
    try:
        post = MarketPost.query.get_or_404(post_id)
        # Increment view count
        post.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'post': post.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_market_post():
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        data = request.form.to_dict()

        # Handle file uploads
        images = request.files.getlist('images')
        image_files = []
        
        for image in images:
            filename, error = save_uploaded_file(image)
            if filename:
                image_files.append(filename)
            elif error:
                return jsonify({'success': False, 'message': error}), 400

        # Parse dates if provided
        harvest_date = None
        expiry_date = None
        preferred_delivery_date = None
        
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

        # Determine if post needs approval (products are auto-approved, requests need approval)
        from models.user import User
        user = User.query.get(user_id)
        post_type = data.get('type', 'product')
        # Auto-approve products, require approval for requests/demands
        approved = post_type == 'product' or user.user_type == 'admin' if user else False

        # Parse tags
        tags = data.get('tags', '')
        if isinstance(tags, list):
            tags = ','.join(tags)

        # Create market post
        market_post = MarketPost(
            user_id=user_id,
            title=data.get('title', ''),
            description=data.get('description', ''),
            price=float(data.get('price', 0)) if data.get('price') else None,
            quantity=float(data.get('quantity', 0)) if data.get('quantity') else None,
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
            expiry_date=expiry_date,
            min_order_quantity=float(data.get('min_order_quantity', 1)),
            max_order_quantity=float(data.get('max_order_quantity')) if data.get('max_order_quantity') else None,
            delivery_available=data.get('delivery_available', 'false').lower() == 'true',
            pickup_available=data.get('pickup_available', 'true').lower() == 'true',
            delivery_radius=float(data.get('delivery_radius')) if data.get('delivery_radius') else None,
            delivery_cost=float(data.get('delivery_cost', 0)),
            tags=tags,
            organic_certified=data.get('organic_certified', 'false').lower() == 'true',
            freshness_guarantee=data.get('freshness_guarantee', 'false').lower() == 'true'
        )

        db.session.add(market_post)
        db.session.flush()

        # Add images
        for i, image_url in enumerate(image_files):
            post_image = MarketPostImage(
                market_post_id=market_post.id,
                image_url=image_url,
                is_primary=(i == 0)  # First image is primary
            )
            db.session.add(post_image)

        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Market post created successfully',
            'post': market_post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_market_post(post_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        post = MarketPost.query.get_or_404(post_id)
        
        # Check if user owns the post or is admin
        from models.user import User
        user = User.query.get(user_id)
        if post.user_id != user_id and user.user_type != 'admin':
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        data = request.get_json() if request.is_json else request.form.to_dict()
        
        # Update fields
        update_fields = [
            'title', 'description', 'price', 'quantity', 'unit', 'category', 
            'location', 'region', 'type', 'status', 'priority', 'quality_grade',
            'min_order_quantity', 'max_order_quantity', 'delivery_available',
            'pickup_available', 'delivery_radius', 'delivery_cost', 'tags',
            'organic_certified', 'freshness_guarantee'
        ]
        
        for field in update_fields:
            if field in data:
                if field == 'tags' and isinstance(data[field], list):
                    setattr(post, field, ','.join(data[field]))
                else:
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

        # Handle image updates if provided
        if 'images' in request.files:
            # Remove existing images
            MarketPostImage.query.filter_by(market_post_id=post_id).delete()
            
            # Add new images
            images = request.files.getlist('images')
            for i, image in enumerate(images):
                filename, error = save_uploaded_file(image)
                if filename:
                    post_image = MarketPostImage(
                        market_post_id=post_id,
                        image_url=filename,
                        is_primary=(i == 0)
                    )
                    db.session.add(post_image)

        post.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post updated successfully',
            'post': post.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_market_post(post_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        post = MarketPost.query.get_or_404(post_id)
        
        # Check if user owns the post or is admin
        from models.user import User
        user = User.query.get(user_id)
        if post.user_id != user_id and user.user_type != 'admin':
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        db.session.delete(post)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>/approve', methods=['POST'])
@jwt_required()
def approve_market_post(post_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403

        post = MarketPost.query.get_or_404(post_id)
        post.approved = True
        post.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post approved successfully',
            'post': post.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>/interest', methods=['POST'])
@jwt_required()
def express_interest(post_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        data = request.get_json() if request.is_json else request.form.to_dict()
        
        # Get the post to validate
        post = MarketPost.query.get_or_404(post_id)
        
        # Prevent users from expressing interest in their own posts
        if post.user_id == user_id:
            return jsonify({'success': False, 'message': 'Cannot express interest in your own post'}), 400
        
        # Check if post is available for interest
        if post.status != 'active' or not post.is_available:
            return jsonify({'success': False, 'message': 'Post is not available for interest'}), 400
        
        # Check if user already expressed interest
        existing_interest = MarketInterest.query.filter_by(
            market_post_id=post_id, user_id=user_id, status='pending'
        ).first()
        
        if existing_interest:
            return jsonify({'success': False, 'message': 'Interest already expressed'}), 400

        # Parse delivery date if provided
        preferred_delivery_date = None
        if data.get('preferred_delivery_date'):
            try:
                preferred_delivery_date = datetime.datetime.strptime(data['preferred_delivery_date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        interest = MarketInterest(
            market_post_id=post_id,
            user_id=user_id,
            message=data.get('message', ''),
            offer_price=float(data.get('offer_price')) if data.get('offer_price') else None,
            offer_quantity=float(data.get('offer_quantity')) if data.get('offer_quantity') else None,
            delivery_preference=data.get('delivery_preference'),
            preferred_delivery_date=preferred_delivery_date,
            contact_method=data.get('contact_method', 'in_app')
        )
        
        db.session.add(interest)
        
        # Update interest count on post
        post.interest_count += 1
        post.updated_at = datetime.datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Interest expressed successfully',
            'interest': interest.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/posts/<int:post_id>/interests', methods=['GET'])
@jwt_required()
def get_post_interests(post_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        post = MarketPost.query.get_or_404(post_id)
        
        # Check if user owns the post or is admin
        from models.user import User
        user = User.query.get(user_id)
        if post.user_id != user_id and user.user_type != 'admin':
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        interests = MarketInterest.query.filter_by(market_post_id=post_id).all()
        
        return jsonify({
            'success': True,
            'interests': [interest.to_dict() for interest in interests]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/interests/<int:interest_id>', methods=['GET'])
@jwt_required()
def get_interest(interest_id):
    try:
        identity = json.loads(get_jwt_identity())
        interest = MarketInterest.query.get_or_404(interest_id)
        
        # Check if user has permission to view this interest
        from models.user import User
        user = User.query.get(identity['id'])
        if (interest.user_id != identity['id'] and 
            interest.market_post.user_id != identity['id'] and 
            user.user_type != 'admin'):
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        return jsonify({
            'success': True,
            'interest': interest.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/interests/<int:interest_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_interest(interest_id):
    try:
        identity = json.loads(get_jwt_identity())
        if identity.get('type') not in ['user', 'admin', 'farmer', 'agent']:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        user_id = identity['id']
        data = request.get_json()
        action = data.get('action')  # accept, decline, counter_offer
        
        interest = MarketInterest.query.get_or_404(interest_id)
        post = interest.market_post
        
        # Check if user owns the post or is admin
        from models.user import User
        user = User.query.get(user_id)
        if post.user_id != user_id and user.user_type != 'admin':
            return jsonify({'success': False, 'message': 'Permission denied'}), 403
        
        # Check if interest is still pending
        if interest.status != 'pending':
            return jsonify({'success': False, 'message': 'Interest has already been processed'}), 400

        if action == 'accept':
            interest.status = 'accepted'
            interest.negotiation_status = 'accepted'
            
            # If it's a need, mark as accepted by this user
            if post.type == 'need':
                post.accepted_by = interest.user_id
                post.status = 'closed'
            
            # Update post status if it's a product
            if post.type == 'product':
                post.status = 'sold'
                post.is_available = False
            
        elif action == 'decline':
            interest.status = 'declined'
            interest.negotiation_status = 'rejected'
            
        elif action == 'counter_offer':
            counter_price = data.get('counter_price')
            counter_quantity = data.get('counter_quantity')
            
            if counter_price:
                interest.counter_price = float(counter_price)
            if counter_quantity:
                interest.counter_quantity = float(counter_quantity)
            
            interest.negotiation_status = 'counter_offer'
            interest.status = 'counter_offered'
            
        else:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400

        interest.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Interest {action}ed successfully',
            'interest': interest.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/my/interests', methods=['GET'])
@jwt_required()
def get_my_interests():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = MarketInterest.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        interests = query.order_by(MarketInterest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'interests': [interest.to_dict() for interest in interests.items],
            'total': interests.total,
            'pages': interests.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_market_stats():
    try:
        identity = json.loads(get_jwt_identity())
        
        user_id = identity['id']
        is_admin = identity.get('type') == 'admin'
        
        if is_admin:
            # Admin stats
            total_posts = MarketPost.query.count()
            pending_approvals = MarketPost.query.filter_by(approved=False).count()
            active_posts = MarketPost.query.filter_by(status='active').count()
            total_interests = MarketInterest.query.count()
            pending_interests = MarketInterest.query.filter_by(status='pending').count()
            
            # Category distribution
            from sqlalchemy import func
            category_stats = db.session.query(
                MarketPost.category,
                func.count(MarketPost.id).label('count')
            ).group_by(MarketPost.category).all()
            
            return jsonify({
                'success': True,
                'stats': {
                    'total_posts': total_posts,
                    'pending_approvals': pending_approvals,
                    'active_posts': active_posts,
                    'total_interests': total_interests,
                    'pending_interests': pending_interests,
                    'category_distribution': {cat: count for cat, count in category_stats}
                }
            })
        else:
            # User stats
            user_posts = MarketPost.query.filter_by(user_id=user_id).count()
            active_user_posts = MarketPost.query.filter_by(user_id=user_id, status='active').count()
            user_interests = MarketInterest.query.filter_by(user_id=user_id).count()
            accepted_interests = MarketInterest.query.filter_by(user_id=user_id, status='accepted').count()
            pending_interests = MarketInterest.query.filter_by(user_id=user_id, status='pending').count()
            
            return jsonify({
                'success': True,
                'stats': {
                    'user_posts': user_posts,
                    'active_user_posts': active_user_posts,
                    'user_interests': user_interests,
                    'accepted_interests': accepted_interests,
                    'pending_interests': pending_interests
                }
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@market_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        from sqlalchemy import func
        categories = db.session.query(
            MarketPost.category,
            func.count(MarketPost.id).label('count')
        ).filter(
            MarketPost.category.isnot(None),
            MarketPost.category != ''
        ).group_by(MarketPost.category).order_by(func.count(MarketPost.id).desc()).all()
        
        return jsonify({
            'success': True,
            'categories': [{'name': cat, 'count': count} for cat, count in categories]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== USER (FARMER) ROUTES ====================

@market_bp.route('/user/products', methods=['GET'])
@jwt_required()
def get_user_products():
    """Get user's own products"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get user's products
        products = MarketPost.query.filter_by(
            user_id=user_id,
            type='product'
        ).order_by(MarketPost.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/products', methods=['POST'])
@jwt_required()
def create_user_product():
    """Create a new product listing"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get form data
        data = request.form.to_dict()
        
        # Handle file upload
        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                filename, error = save_uploaded_file(file)
                if error:
                    return jsonify({'error': error}), 400
                image_url = filename
        
        # Create market post with all fields
        market_post = MarketPost(
            title=data['name'],
            description=data.get('description', ''),
            category=data.get('category', ''),
            price=float(data.get('price', 0)),
            quantity=int(data.get('quantity', 1)),
            unit=data.get('unit', 'kg'),
            location=data.get('location', ''),
            quality_grade=data.get('qualityGrade', 'A'),
            organic_certified=data.get('organic', 'false').lower() == 'true',
            min_order_quantity=int(data.get('minOrder', 1)),
            user_id=identity['id'],
            type='product',
            status='pending'
        )
        
        # Parse harvest date if provided
        if data.get('harvestDate'):
            try:
                market_post.harvest_date = datetime.datetime.strptime(
                    data['harvestDate'], '%Y-%m-%d'
                ).date()
            except ValueError:
                pass
        
        db.session.add(market_post)
        db.session.flush()
        
        # Add image if uploaded
        if image_url:
            post_image = MarketPostImage(
                market_post_id=market_post.id,
                image_url=image_url
            )
            db.session.add(post_image)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'product': market_post.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating user product: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_user_product(product_id):
    """Update user's product"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get product and verify ownership
        product = MarketPost.query.get(product_id)
        if not product or product.user_id != user_id:
            return jsonify({'error': 'Product not found or access denied'}), 404
        
        data = request.get_json()
        
        # Update fields
        for field in ['title', 'description', 'price', 'quantity', 'unit', 
                     'category', 'location', 'region', 'quality_grade']:
            if field in data:
                setattr(product, field, data[field])
        
        if 'organic' in data:
            product.organic_certified = data['organic']
        
        product.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully',
            'product': product.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_user_product(product_id):
    """Delete user's product"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get product and verify ownership
        product = MarketPost.query.get(product_id)
        if not product or product.user_id != user_id:
            return jsonify({'error': 'Product not found or access denied'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/admin-requests', methods=['GET'])
@jwt_required()
def get_admin_requests():
    """Get requests from admins for user's products"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get interests in user's products from admins
        user_products = MarketPost.query.filter_by(
            user_id=user_id,
            type='product'
        ).all()
        
        product_ids = [p.id for p in user_products]
        
        interests = MarketInterest.query.filter(
            MarketInterest.market_post_id.in_(product_ids)
        ).join(User, MarketInterest.user_id == User.id).filter(
            User.user_type == 'admin'
        ).order_by(MarketInterest.created_at.desc()).all()
        
        requests = []
        for interest in interests:
            request_data = interest.to_dict()
            request_data['product'] = interest.market_post.to_dict()
            request_data['admin'] = interest.user.to_dict()
            requests.append(request_data)
        
        return jsonify({
            'success': True,
            'requests': requests
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/admin-requests/<int:interest_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_admin_request(interest_id):
    """Respond to admin request (accept/decline)"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        data = request.get_json()
        response_type = data.get('response')  # 'accept' or 'decline'
        
        if response_type not in ['accept', 'decline']:
            return jsonify({'error': 'Invalid response type'}), 400
        
        # Get interest and verify it's for user's product
        interest = MarketInterest.query.get(interest_id)
        if not interest or interest.market_post.user_id != user_id:
            return jsonify({'error': 'Request not found or access denied'}), 404
        
        # Update interest status
        interest.status = 'accepted' if response_type == 'accept' else 'declined'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Request {response_type}ed successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """Get user notifications"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Generate notifications based on recent activity
        notifications = [
            {
                'id': 1,
                'type': 'admin_request',
                'title': 'New Admin Request',
                'message': 'An admin is interested in your tomatoes',
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'read': False
            },
            {
                'id': 2,
                'type': 'market_update',
                'title': 'Market Demand Alert',
                'message': 'High demand for organic vegetables this week',
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'read': False
            }
        ]
        
        return jsonify({
            'success': True,
            'notifications': notifications
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/market-insights', methods=['GET'])
@jwt_required()
def get_user_market_insights():
    """Get market insights for users"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Generate market insights
        insights = [
            {
                'id': 1,
                'category': 'vegetables',
                'trend': 'up',
                'price_change': '+15%',
                'demand_level': 'high',
                'recommendation': 'Great time to list vegetable products'
            },
            {
                'id': 2,
                'category': 'fruits',
                'trend': 'stable',
                'price_change': '+2%',
                'demand_level': 'medium',
                'recommendation': 'Steady market for fruit products'
            }
        ]
        
        return jsonify({
            'success': True,
            'insights': insights
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/sales', methods=['GET'])
@jwt_required()
def get_user_sales():
    """Get user's sales data"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get completed sales (accepted interests)
        user_products = MarketPost.query.filter_by(
            user_id=user_id,
            type='product'
        ).all()
        
        product_ids = [p.id for p in user_products]
        
        completed_sales = MarketInterest.query.filter(
            MarketInterest.market_post_id.in_(product_ids),
            MarketInterest.status == 'accepted'
        ).all()
        
        sales_data = []
        for sale in completed_sales:
            if sale.market_post and sale.offer_quantity:
                amount = sale.market_post.price * sale.offer_quantity
                sales_data.append({
                    'id': sale.id,
                    'product_name': sale.market_post.title,
                    'quantity': sale.offer_quantity,
                    'price_per_unit': sale.market_post.price,
                    'amount': amount,
                    'date': sale.created_at.isoformat(),
                    'status': 'completed',
                    'buyer': sale.user.username if sale.user else 'Unknown'
                })
        
        return jsonify({
            'success': True,
            'sales': sales_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/dashboard', methods=['GET'])
@jwt_required()
def get_user_dashboard():
    """Get user dashboard summary data"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # Get user's products
        products = MarketPost.query.filter_by(
            user_id=user_id,
            type='product'
        ).all()
        
        product_ids = [p.id for p in products]
        
        # Get interests in user's products
        interests = MarketInterest.query.filter(
            MarketInterest.market_post_id.in_(product_ids)
        ).all()
        
        # Calculate stats
        total_earnings = 0
        pending_requests = 0
        active_products = 0
        
        for product in products:
            if product.is_available:
                active_products += 1
        
        for interest in interests:
            if interest.status == 'pending':
                pending_requests += 1
            elif interest.status == 'accepted' and interest.offer_quantity:
                total_earnings += interest.market_post.price * interest.offer_quantity
        
        return jsonify({
            'success': True,
            'stats': {
                'total_products': len(products),
                'active_products': active_products,
                'pending_requests': pending_requests,
                'total_earnings': total_earnings
            },
            'recent_products': [p.to_dict() for p in products[:5]],
            'recent_interests': [i.to_dict() for i in interests[:5]]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ADMIN (AGENT) ROUTES ====================

@market_bp.route('/admin/user-products', methods=['GET'])
@jwt_required()
def get_admin_user_products():
    """Get products from users that admins can connect with buyers"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get ALL user products (both approved and pending) for admin review
        products = MarketPost.query.filter(
            MarketPost.type == 'product',
            MarketPost.status == 'active'
        ).order_by(MarketPost.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/buyer-requests', methods=['GET'])
@jwt_required()
def get_admin_buyer_requests():
    """Get market needs/requests from buyers/other admins"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get market needs (buyer requests)
        buyer_requests = MarketPost.query.filter(
            MarketPost.type == 'need',
            MarketPost.status == 'active'
        ).order_by(MarketPost.priority.desc(), MarketPost.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'requests': [request.to_dict() for request in buyer_requests]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/product-requests', methods=['POST'])
@jwt_required()
def admin_request_product():
    """Admin requests a specific product from user for a buyer"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        product_id = data.get('productId')
        quantity = data.get('quantity')
        message = data.get('message', '')
        
        if not product_id or not quantity:
            return jsonify({'error': 'Product ID and quantity are required'}), 400
        
        # Verify product exists
        product = MarketPost.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Create interest record for tracking
        interest = MarketInterest(
            market_post_id=product_id,
            user_id=user_id,
            message=f"Admin request: {message}",
            offer_quantity=float(quantity),
            status='pending'
        )
        
        db.session.add(interest)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product request sent successfully',
            'interest_id': interest.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/transactions', methods=['GET'])
@jwt_required()
def get_admin_transactions():
    """Get admin's transaction history"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get interests/transactions involving this admin
        transactions = MarketInterest.query.filter_by(user_id=user_id).order_by(
            MarketInterest.created_at.desc()
        ).all()
        
        transaction_data = []
        for transaction in transactions:
            transaction_dict = transaction.to_dict()
            transaction_dict['product'] = transaction.market_post.to_dict() if transaction.market_post else None
            transaction_data.append(transaction_dict)
        
        return jsonify({
            'success': True,
            'transactions': transaction_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/commissions', methods=['GET'])
@jwt_required()
def get_admin_commissions():
    """Get admin's commission data"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Calculate commissions from completed transactions
        completed_transactions = MarketInterest.query.filter_by(
            user_id=user_id,
            status='accepted'
        ).all()
        
        commissions = []
        total_commission = 0
        
        for transaction in completed_transactions:
            if transaction.market_post and transaction.offer_quantity:
                product_value = transaction.market_post.price * transaction.offer_quantity
                commission_rate = 0.05  # 5% commission
                commission_amount = product_value * commission_rate
                total_commission += commission_amount
                
                commissions.append({
                    'id': transaction.id,
                    'product_name': transaction.market_post.title,
                    'transaction_value': product_value,
                    'commission_rate': commission_rate,
                    'earned': commission_amount,
                    'date': transaction.created_at.isoformat(),
                    'status': 'paid'  # Simplified for now
                })
        
        return jsonify({
            'success': True,
            'commissions': commissions,
            'total_earned': total_commission
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/market-updates', methods=['GET'])
@jwt_required()
def get_admin_market_updates():
    """Get market trends and updates for admins"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Generate market insights based on recent activity
        recent_products = MarketPost.query.filter(
            MarketPost.type == 'product',
            MarketPost.created_at >= datetime.datetime.utcnow() - datetime.timedelta(days=7)
        ).all()
        
        recent_needs = MarketPost.query.filter(
            MarketPost.type == 'need',
            MarketPost.created_at >= datetime.datetime.utcnow() - datetime.timedelta(days=7)
        ).all()
        
        updates = [
            {
                'id': 1,
                'type': 'market_trend',
                'title': 'Weekly Market Summary',
                'description': f'{len(recent_products)} new products and {len(recent_needs)} new buyer requests this week',
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'importance': 'medium'
            },
            {
                'id': 2,
                'type': 'opportunity',
                'title': 'High Demand Products',
                'description': 'Vegetables and fruits are in high demand this week',
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'importance': 'high'
            }
        ]
        
        return jsonify({
            'success': True,
            'updates': updates
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/trending-products', methods=['GET'])
@jwt_required()
def get_admin_trending_products():
    """Get trending products for admins"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get products with high interest/view counts
        trending_products = MarketPost.query.filter(
            MarketPost.type == 'product',
            MarketPost.status == 'active'
        ).order_by(
            MarketPost.interest_count.desc(),
            MarketPost.view_count.desc()
        ).limit(10).all()
        
        return jsonify({
            'success': True,
            'trending': [product.to_dict() for product in trending_products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
def get_admin_dashboard():
    """Get admin dashboard summary data"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Calculate dashboard stats
        total_transactions = MarketInterest.query.filter_by(user_id=user_id).count()
        active_transactions = MarketInterest.query.filter_by(
            user_id=user_id,
            status='pending'
        ).count()
        completed_deals = MarketInterest.query.filter_by(
            user_id=user_id,
            status='accepted'
        ).count()
        
        # Calculate total commission (simplified)
        completed_interests = MarketInterest.query.filter_by(
            user_id=user_id,
            status='accepted'
        ).all()
        
        total_commission = 0
        for interest in completed_interests:
            if interest.market_post and interest.offer_quantity:
                product_value = interest.market_post.price * interest.offer_quantity
                total_commission += product_value * 0.05  # 5% commission
        
        return jsonify({
            'success': True,
            'stats': {
                'totalCommission': total_commission,
                'activeTransactions': active_transactions,
                'completedDeals': completed_deals,
                'pendingRequests': active_transactions
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ADDITIONAL ENDPOINTS ====================

@market_bp.route('/user/fill-form/<int:request_id>', methods=['POST'])
@jwt_required()
def user_fill_form(request_id):
    """Fill form for admin request - placeholder endpoint"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        data = request.get_json()
        
        # This is a placeholder implementation
        # You would implement the actual form filling logic here
        
        return jsonify({
            'success': True,
            'message': 'Form filled successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/notifications/<int:notification_id>', methods=['PATCH'])
@jwt_required()
def mark_user_notification_read(notification_id):
    """Mark user notification as read - placeholder endpoint"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        # This is a placeholder implementation
        # You would implement the actual notification marking logic here
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== PRODUCT REQUEST & DELIVERY ENDPOINTS ====================

@market_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_product_request():
    """Create a product request from buyer to farmer"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity_requested')
        price_offered = data.get('price_offered')
        message = data.get('message', '')
        
        # Get product and farmer info
        product = MarketPost.query.get_or_404(product_id)
        
        # Import the new model
        from models.market import ProductRequest
        
        # Create product request
        product_request = ProductRequest(
            product_id=product_id,
            buyer_id=user_id,
            farmer_id=product.user_id,
            quantity_requested=quantity,
            price_offered=price_offered,
            message=message
        )
        
        db.session.add(product_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product request sent successfully',
            'request': product_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_product_request():
    """Farmer approves a product request"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        from models.market import ProductRequest
        
        product_request = ProductRequest.query.get_or_404(request_id)
        
        # Verify farmer owns the product
        if product_request.farmer_id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        product_request.status = 'approved'
        product_request.approved_at = datetime.datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request approved successfully',
            'request': product_request.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_product_request():
    """Farmer rejects a product request"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        from models.market import ProductRequest
        
        product_request = ProductRequest.query.get_or_404(request_id)
        
        # Verify farmer owns the product
        if product_request.farmer_id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        product_request.status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request rejected successfully',
            'request': product_request.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/requests/<int:request_id>/delivery', methods=['POST'])
@jwt_required()
def create_delivery_details():
    """Create delivery details for approved request"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        data = request.get_json()
        
        from models.market import ProductRequest, DeliveryDetails
        
        product_request = ProductRequest.query.get_or_404(request_id)
        
        # Verify farmer owns the product
        if product_request.farmer_id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Parse dates
        pickup_date = None
        delivery_date = None
        
        if data.get('pickup_date'):
            pickup_date = datetime.datetime.strptime(data['pickup_date'], '%Y-%m-%d').date()
        if data.get('delivery_date'):
            delivery_date = datetime.datetime.strptime(data['delivery_date'], '%Y-%m-%d').date()
        
        # Create delivery details
        delivery = DeliveryDetails(
            request_id=request_id,
            pickup_date=pickup_date,
            delivery_date=delivery_date,
            pickup_address=data.get('pickup_address'),
            delivery_address=data.get('delivery_address'),
            contact_phone=data.get('contact_phone'),
            special_instructions=data.get('special_instructions')
        )
        
        db.session.add(delivery)
        
        # Update request status
        product_request.status = 'completed'
        
        # Mark product as sold and move to history
        product = product_request.product
        product.status = 'sold'
        product.is_available = False
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Delivery details created successfully',
            'delivery': delivery.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/user/requests', methods=['GET'])
@jwt_required()
def get_user_requests():
    """Get user's product requests"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is a regular user (farmer)
        if identity.get('type') != 'user':
            return jsonify({'error': 'User access required'}), 403
        
        from models.market import ProductRequest
        
        # Get requests for user's products
        requests = ProductRequest.query.filter_by(farmer_id=user_id).order_by(
            ProductRequest.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'requests': [req.to_dict() for req in requests]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== NOTIFICATION ENDPOINTS ====================

@market_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_market_notifications():
    """Get market notifications"""
    try:
        identity = json.loads(get_jwt_identity())
        
        from models.market import MarketNotification
        
        # Get all active notifications
        notifications = MarketNotification.query.filter_by(
            status='active'
        ).order_by(MarketNotification.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'notifications': [notification.to_dict() for notification in notifications]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_market_notification():
    """Create market notification (admin only)"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        from models.market import MarketNotification
        
        # Parse expiry date
        expiry_date = None
        if data.get('expiryDate'):
            try:
                expiry_date = datetime.datetime.strptime(data['expiryDate'], '%Y-%m-%d').date()
            except ValueError:
                pass
        
        notification = MarketNotification(
            admin_id=user_id,
            type=data.get('type', 'market_gap'),
            region=data.get('region'),
            product_needed=data.get('productNeeded'),
            quantity=data.get('quantity'),
            price_range=data.get('priceRange'),
            exact_location=data.get('exactLocation'),
            urgency=data.get('urgency', 'medium'),
            expiry_date=expiry_date
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification created successfully',
            'notification': notification.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/notifications/<int:notification_id>', methods=['PUT'])
@jwt_required()
def update_market_notification(notification_id):
    """Update market notification"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        from models.market import MarketNotification
        
        notification = MarketNotification.query.get_or_404(notification_id)
        
        # Verify admin owns the notification
        if notification.admin_id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        
        # Update fields
        update_fields = ['type', 'region', 'product_needed', 'quantity', 
                        'price_range', 'exact_location', 'urgency', 'status']
        
        for field in update_fields:
            if field in data:
                setattr(notification, field, data[field])
        
        # Handle frontend camelCase fields
        if 'productNeeded' in data:
            notification.product_needed = data['productNeeded']
        if 'priceRange' in data:
            notification.price_range = data['priceRange']
        if 'exactLocation' in data:
            notification.exact_location = data['exactLocation']
        
        # Parse expiry date
        if 'expiryDate' in data and data['expiryDate']:
            try:
                notification.expiry_date = datetime.datetime.strptime(data['expiryDate'], '%Y-%m-%d').date()
            except ValueError:
                pass
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification updated successfully',
            'notification': notification.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_market_notification(notification_id):
    """Delete market notification"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        from models.market import MarketNotification
        
        notification = MarketNotification.query.get_or_404(notification_id)
        
        # Verify admin owns the notification
        if notification.admin_id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/posts/<int:post_id>/request', methods=['POST'])
@jwt_required()
def admin_request_product_new():
    """Admin requests a product from user (creates interest with admin request flag)"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Get the product
        product = MarketPost.query.get_or_404(post_id)
        
        # Create interest with admin request flag
        interest = MarketInterest(
            market_post_id=post_id,
            user_id=user_id,
            message=data.get('message', 'Admin is interested in this product'),
            offer_quantity=data.get('quantity'),
            status='pending',
            admin_requested=True  # Add this field to identify admin requests
        )
        
        db.session.add(interest)
        
        # Update product status to show admin has requested
        product.status = 'requested'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product request sent successfully',
            'interest': interest.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/posts/<int:post_id>/reject', methods=['POST'])
@jwt_required()
def admin_reject_product():
    """Admin rejects a product"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Verify user is an admin
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get the product
        product = MarketPost.query.get_or_404(post_id)
        
        # Update product status
        product.status = 'rejected'
        product.approved = False
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product rejected successfully',
            'product': product.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    """Get farmer's received requests"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        from models.market import ProductRequest
        
        requests = ProductRequest.query.filter_by(farmer_id=user_id).order_by(
            ProductRequest.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'requests': [req.to_dict() for req in requests]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/admin/demands', methods=['POST'])
@jwt_required()
def create_market_demand():
    """Admin creates market demand notification"""
    try:
        identity = json.loads(get_jwt_identity())
        
        if identity.get('type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        from models.market import MarketDemand
        
        # Parse expiry date
        expires_at = None
        if data.get('expires_at'):
            expires_at = datetime.datetime.strptime(data['expires_at'], '%Y-%m-%d %H:%M:%S')
        
        demand = MarketDemand(
            crop_name=data.get('crop_name'),
            quantity_needed=data.get('quantity_needed'),
            price_range=data.get('price_range'),
            region=data.get('region'),
            buyer_info=data.get('buyer_info'),
            urgency=data.get('urgency', 'medium'),
            expires_at=expires_at
        )
        
        db.session.add(demand)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Market demand created successfully',
            'demand': demand.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@market_bp.route('/demands', methods=['GET'])
@jwt_required()
def get_market_demands():
    """Get active market demands for farmers"""
    try:
        from models.market import MarketDemand
        
        demands = MarketDemand.query.filter_by(is_active=True).order_by(
            MarketDemand.urgency.desc(),
            MarketDemand.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'demands': [demand.to_dict() for demand in demands]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@market_bp.route('/history', methods=['GET'])
@jwt_required()
def get_market_history():
    """Get completed transactions history"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Get completed products for this user
        completed_products = MarketPost.query.filter_by(
            user_id=user_id,
            status='sold'
        ).order_by(MarketPost.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'history': [product.to_dict() for product in completed_products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500