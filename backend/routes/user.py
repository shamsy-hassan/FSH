from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from extensions import db

user_bp = Blueprint('user', __name__)

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def user_dashboard():
    import json
    identity = json.loads(get_jwt_identity())
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get user statistics
    from models.order import Order
    from models.market import MarketPost
    from models.storage import StorageRequest
    
    order_count = Order.query.filter_by(user_id=user_id).count()
    market_post_count = MarketPost.query.filter_by(user_id=user_id).count()
    storage_request_count = StorageRequest.query.filter_by(user_id=user_id).count()
    
    # Get recent activity
    recent_orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).limit(5).all()
    recent_posts = MarketPost.query.filter_by(user_id=user_id).order_by(MarketPost.created_at.desc()).limit(5).all()
    
    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else None,
        'stats': {
            'orders': order_count,
            'market_posts': market_post_count,
            'storage_requests': storage_request_count
        },
        'recent_orders': [order.to_dict() for order in recent_orders],
        'recent_posts': [post.to_dict() for post in recent_posts]
    })

@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    
    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else None
    })

@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    user = User.query.get(user_id)
    data = request.get_json()
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({'message': 'Current password is incorrect'}), 400
    
    # Set new password
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})

@user_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    import json
    identity = json.loads(get_jwt_identity())
    
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 20)), 50)  # Max 50 results
    show_all = request.args.get('all', 'false').lower() == 'true'
    
    # Get current user ID to exclude from results
    current_user_id = identity['id']
    
    if show_all or not query:
        # Get all active users (for user list in messaging)
        users = User.query.filter(
            User.id != current_user_id,  # Exclude current user
            User.is_active == True       # Only active users
        ).limit(limit).all()
    else:
        # Search users by username or email (partial match)
        if len(query) < 2:
            return jsonify({'users': []})
            
        users = User.query.filter(
            User.id != current_user_id,  # Exclude current user
            User.is_active == True,      # Only active users
            db.or_(
                User.username.ilike(f'%{query}%'),
                User.email.ilike(f'%{query}%')
            )
        ).limit(limit).all()
    
    user_list = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'user_type': user.user_type,
            'avatar': f'👨‍🌾' if user.user_type == 'farmer' else f'👨‍💼'
        }
        user_list.append(user_data)
    
    return jsonify({'users': user_list})