# backend/routes/order.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.order import Order, OrderItem, OrderStatus
from models.ecommerce import Cart, CartItem
from extensions import db
import datetime
import random
import string
import json

order_bp = Blueprint('order', __name__)

@order_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_orders():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        user_type = identity['type']
        
        # Query params
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        status = request.args.get("status")
        
        # Determine base query
        query = Order.query
        
        # If not admin, filter by user ID
        if user_type != "admin":
            query = query.filter_by(user_id=user_id)
        
        # Apply status filter if provided
        if status and status != "all":
            try:
                order_status = OrderStatus(status.lower())
                query = query.filter_by(status=order_status)
            except ValueError:
                valid_statuses = [s.value for s in OrderStatus]
                return jsonify({
                    'message': 'Invalid order status',
                    'valid_statuses': valid_statuses
                }), 422
        
        # Apply pagination
        pagination = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        orders = [order.to_dict() for order in pagination.items]
        
        return jsonify({
            "orders": orders,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
            "message": "Orders retrieved successfully"
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving orders: {str(e)}'}), 500

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        user_type = identity['type']
        
        order = Order.query.get_or_404(order_id)
        
        # Check authorization
        if user_type == 'user' and order.user_id != user_id:
            return jsonify({'message': 'Not authorized to view this order'}), 403
        
        return jsonify({
            'order': order.to_dict(),
            'message': 'Order retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving order: {str(e)}'}), 500

@order_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        user_type = identity['type']
        
        if user_type != 'user':
            return jsonify({'message': 'User access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'shipping_address' not in data:
            return jsonify({'message': 'Shipping address is required'}), 400
        
        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart or not cart.items:
            return jsonify({'message': 'Cart is empty'}), 400
        
        # Check stock availability
        for item in cart.items:
            if item.product.stock_quantity < item.quantity:
                return jsonify({
                    'message': f'Insufficient stock for {item.product.name}'
                }), 400
        
        # Generate order number
        order_number = generate_order_number()
        
        # Calculate total amount
        total_amount = sum(item.subtotal for item in cart.items)
        
        # Create order
        order = Order(
            user_id=user_id,
            order_number=order_number,
            total_amount=total_amount,
            shipping_address=data['shipping_address'],
            billing_address=data.get('billing_address', data['shipping_address']),
            payment_method=data.get('payment_method', 'cash_on_delivery'),
            payment_status='pending',
            status=OrderStatus.PENDING
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID without committing
        
        # Create order items from cart items and update stock
        for cart_item in cart.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price=cart_item.product.price,
                subtotal=cart_item.subtotal
            )
            db.session.add(order_item)
            
            # Update product stock
            cart_item.product.stock_quantity -= cart_item.quantity
        
        # Clear the cart
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating order: {str(e)}'}), 500

@order_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    try:
        current_user = get_jwt_identity()
        
        # Handle different JWT token structures
        user_type = None
        
        if isinstance(current_user, dict):
            user_type = current_user.get("type") or current_user.get("user_type")
        else:
            user_type = "user"
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'message': 'Status is required'}), 400
        
        try:
            new_status = OrderStatus(data['status'].lower())
            order.status = new_status
            
            # If order is delivered, mark payment as completed if it was pending
            if new_status == OrderStatus.DELIVERED and order.payment_status == 'pending':
                order.payment_status = 'completed'
            
            db.session.commit()
            
            return jsonify({
                'message': 'Order status updated successfully',
                'order': order.to_dict()
            }), 200
        except ValueError:
            valid_statuses = [s.value for s in OrderStatus]
            return jsonify({
                'message': 'Invalid order status',
                'valid_statuses': valid_statuses
            }), 422
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating order status: {str(e)}'}), 500

@order_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    try:
        current_user = get_jwt_identity()
        
        # Handle different JWT token structures
        user_type = None
        user_id = None
        
        if isinstance(current_user, dict):
            user_type = current_user.get("type") or current_user.get("user_type")
            user_id = current_user.get("id") or current_user.get("user_id")
        else:
            user_id = current_user
            user_type = "user"
        
        order = Order.query.get_or_404(order_id)
        
        # Check authorization
        if user_type == 'user' and order.user_id != user_id:
            return jsonify({'message': 'Not authorized to update this order'}), 403
        
        data = request.get_json()
        
        # Only allow certain fields to be updated
        if 'shipping_address' in data:
            order.shipping_address = data['shipping_address']
        if 'billing_address' in data:
            order.billing_address = data['billing_address']
        if 'payment_method' in data:
            order.payment_method = data['payment_method']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating order: {str(e)}'}), 500

@order_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_order(order_id):
    try:
        current_user = get_jwt_identity()
        
        # Handle different JWT token structures
        user_type = None
        user_id = None
        
        if isinstance(current_user, dict):
            user_type = current_user.get("type") or current_user.get("user_type")
            user_id = current_user.get("id") or current_user.get("user_id")
        else:
            user_id = current_user
            user_type = "user"
        
        order = Order.query.get_or_404(order_id)
        
        # Check authorization
        if user_type == 'user' and order.user_id != user_id:
            return jsonify({'message': 'Not authorized to cancel this order'}), 403
        
        # Only allow cancellation of pending orders
        if order.status != OrderStatus.PENDING:
            return jsonify({
                'message': 'Only pending orders can be cancelled'
            }), 400
        
        # Restore product stock
        for item in order.items:
            item.product.stock_quantity += item.quantity
        
        # Update order status
        order.status = OrderStatus.CANCELLED
        db.session.commit()
        
        return jsonify({
            'message': 'Order cancelled successfully',
            'order': order.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error cancelling order: {str(e)}'}), 500

def generate_order_number():
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f'ORD-{timestamp}-{random_str}'