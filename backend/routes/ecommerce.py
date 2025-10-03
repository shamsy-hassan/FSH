#backend/routes/ecommerce.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.ecommerce import Category, Product, Cart, CartItem
from models.order import OrderItem  # Add missing import
from extensions import db
from werkzeug.utils import secure_filename
import os
import uuid
import json

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file):
    if not file or not allowed_file(file.filename):
        return None
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)
    return filename

ecommerce_bp = Blueprint('ecommerce', __name__)

# Public routes
@ecommerce_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify({
            'categories': [category.to_dict() for category in categories],
            'message': 'Categories retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving categories: {str(e)}'}), 500

@ecommerce_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)
        return jsonify({
            'category': category.to_dict(),
            'message': 'Category retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving category: {str(e)}'}), 500

@ecommerce_bp.route('/products', methods=['GET'])
def get_products():
    try:
        category_id = request.args.get('category_id')
        search = request.args.get('search')
        sort = request.args.get('sort', 'created_at')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Product.query.filter_by(is_active=True)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%'))
        
        # Sorting
        if sort == 'price_asc':
            query = query.order_by(Product.price.asc())
        elif sort == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort == 'name':
            query = query.order_by(Product.name.asc())
        else:
            query = query.order_by(Product.created_at.desc())
        
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page,
            'message': 'Products retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving products: {str(e)}'}), 500

@ecommerce_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        if not product.is_active:
            return jsonify({'message': 'Product not found'}), 404
        
        return jsonify({
            'product': product.to_dict(),
            'message': 'Product retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving product: {str(e)}'}), 500

# User cart operations
@ecommerce_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        
        return jsonify({
            'cart': cart.to_dict(),
            'message': 'Cart retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error retrieving cart: {str(e)}'}), 500

@ecommerce_bp.route('/cart/items', methods=['POST'])
@jwt_required()
def add_to_cart():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        data = request.get_json()
        
        if not data or 'product_id' not in data:
            return jsonify({'message': 'Product ID is required'}), 400
        
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        
        product = Product.query.get(data['product_id'])
        if not product or not product.is_active:
            return jsonify({'message': 'Product not found'}), 404
        
        if product.stock_quantity < data.get('quantity', 1):
            return jsonify({'message': 'Insufficient stock'}), 400
        
        existing_item = CartItem.query.filter_by(
            cart_id=cart.id, 
            product_id=data['product_id']
        ).first()
        
        if existing_item:
            existing_item.quantity += data.get('quantity', 1)
        else:
            new_item = CartItem(
                cart_id=cart.id,
                product_id=data['product_id'],
                quantity=data.get('quantity', 1)
            )
            db.session.add(new_item)
        
        db.session.commit()
        
        return jsonify({
            'cart': cart.to_dict(),
            'message': 'Item added to cart successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding to cart: {str(e)}'}), 500

@ecommerce_bp.route('/cart/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        data = request.get_json()
        
        if not data or 'quantity' not in data:
            return jsonify({'message': 'Quantity is required'}), 400
        
        item = CartItem.query.get_or_404(item_id)
        
        if item.cart.user_id != user_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        if data['quantity'] <= 0:
            db.session.delete(item)
        else:
            if item.product.stock_quantity < data['quantity']:
                return jsonify({'message': 'Insufficient stock'}), 400
            item.quantity = data['quantity']
        
        db.session.commit()
        
        return jsonify({
            'cart': item.cart.to_dict(),
            'message': 'Cart item updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating cart item: {str(e)}'}), 500

@ecommerce_bp.route('/cart/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        item = CartItem.query.get_or_404(item_id)
        
        if item.cart.user_id != user_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Item removed from cart successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error removing from cart: {str(e)}'}), 500

@ecommerce_bp.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if cart:
            CartItem.query.filter_by(cart_id=cart.id).delete()
            db.session.commit()
        
        return jsonify({
            'message': 'Cart cleared successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error clearing cart: {str(e)}'}), 500

# Admin operations
@ecommerce_bp.route('/admin/products', methods=['GET'])
@jwt_required()
def admin_get_products():
    try:
        import json
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')

        query = Product.query

        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)

        # Check if Product has created_at, else fallback to id
        if hasattr(Product, 'created_at'):
            query = query.order_by(Product.created_at.desc())
        else:
            query = query.order_by(Product.id.desc())

        # Handle paginate depending on SQLAlchemy version
        try:
            products = query.paginate(page=page, per_page=per_page, error_out=False)
        except AttributeError:
            # Flask-SQLAlchemy 3.x uses db.paginate
            products = db.paginate(query, page=page, per_page=per_page, error_out=False)

        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page,
            'message': 'Products retrieved successfully'
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error retrieving products: {str(e)}'}), 500

@ecommerce_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        import json
        identity_raw = get_jwt_identity()
        identity = identity_raw if isinstance(identity_raw, dict) else json.loads(identity_raw)
        user_type = identity.get('type')
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.form
        file = request.files.get('image')
        
        print(f"DEBUG: Received form data keys: {list(data.keys())}")
        print(f"DEBUG: Form data values: {dict(data)}")
        
        # Validate required fields with detailed debugging
        required_fields = ['name', 'price', 'category_id']
        for field in required_fields:
            if field not in data:
                print(f"DEBUG: Missing field: {field}")
                return jsonify({'message': f'{field.replace("_", " ").title()} is required'}), 400
            if not data[field] or data[field].strip() == '':
                print(f"DEBUG: Empty field: {field} = '{data[field]}'")
                return jsonify({'message': f'{field.replace("_", " ").title()} cannot be empty'}), 400
            print(f"DEBUG: Valid field: {field} = '{data[field]}'")
        
        # Check if category exists
        try:
            category_id = int(data['category_id'])
            from models.ecommerce import Category
            category = Category.query.get(category_id)
            if not category:
                print(f"DEBUG: Category not found: {category_id}")
                return jsonify({'message': f'Category with ID {category_id} does not exist'}), 400
            print(f"DEBUG: Category found: {category.name}")
        except ValueError:
            print(f"DEBUG: Invalid category_id format: '{data['category_id']}'")
            return jsonify({'message': 'Category ID must be a valid number'}), 400
        
        image_path = save_image(file) if file else None
        print(f"DEBUG: Image path: {image_path}")
        
        # Convert data with error handling
        try:
            price = float(data['price'])
            stock_quantity = int(data.get('stock_quantity', 0) or 0)
            weight = float(data['weight']) if data.get('weight') and data.get('weight').strip() else None
            discount = float(data.get('discount', 0) or 0)
            print(f"DEBUG: Converted values - price: {price}, stock: {stock_quantity}, weight: {weight}, discount: {discount}")
        except ValueError as ve:
            print(f"DEBUG: Value conversion error: {ve}")
            return jsonify({'message': f'Invalid number format: {str(ve)}'}), 400
        
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=price,
            category_id=category_id,
            stock_quantity=stock_quantity,
            image=image_path,
            brand=data.get('brand', ''),
            weight=weight,
            dimensions=data.get('dimensions', ''),
            is_active=data.get('is_active', 'true').lower() == 'true',
            discount=discount,
            is_featured=data.get('is_featured', 'false').lower() == 'true'
        )
        
        print(f"DEBUG: Product object created successfully")
        
        db.session.add(product)
        db.session.commit()
        
        print(f"DEBUG: Product saved to database with ID: {product.id}")
        
        return jsonify({
            'product': product.to_dict(),
            'message': 'Product created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG: Exception in create_product: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error creating product: {str(e)}'}), 500

@ecommerce_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        product = Product.query.get_or_404(product_id)
        data = request.form
        file = request.files.get('image')
        
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'category_id' in data:
            product.category_id = int(data['category_id'])
        if 'stock_quantity' in data:
            product.stock_quantity = int(data['stock_quantity'])
        if 'brand' in data:
            product.brand = data['brand']
        if 'weight' in data:
            product.weight = float(data['weight']) if data['weight'] else None
        if 'dimensions' in data:
            product.dimensions = data['dimensions']
        if 'is_active' in data:
            product.is_active = data['is_active'].lower() == 'true'
        if 'discount' in data:
            product.discount = float(data['discount'])
        if 'is_featured' in data:
            product.is_featured = data['is_featured'].lower() == 'true'
        
        if file:
            product.image = save_image(file)
        
        db.session.commit()
        
        return jsonify({
            'product': product.to_dict(),
            'message': 'Product updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating product: {str(e)}'}), 500

@ecommerce_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        product = Product.query.get_or_404(product_id)
        
        # Check if product is in any active orders
        from models.order import OrderItem
        order_items = OrderItem.query.filter_by(product_id=product_id).first()
        if order_items:
            return jsonify({
                'message': 'Cannot delete product with existing orders. Deactivate instead.'
            }), 400
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting product: {str(e)}'}), 500

@ecommerce_bp.route('/products/<int:product_id>/status', methods=['PATCH'])
@jwt_required()
def update_product_status(product_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        product = Product.query.get_or_404(product_id)
        
        if 'is_active' not in data:
            return jsonify({'message': 'is_active field is required'}), 400
        
        product.is_active = bool(data['is_active'])
        db.session.commit()
        
        return jsonify({
            'product': product.to_dict(),
            'message': 'Product status updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating product status: {str(e)}'}), 500

@ecommerce_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        import json
        identity_raw = get_jwt_identity()
        identity = identity_raw if isinstance(identity_raw, dict) else json.loads(identity_raw)
        user_type = identity.get('type')
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        data = request.form
        file = request.files.get('image')
        if 'name' not in data or not data['name']:
            return jsonify({'message': 'Name is required'}), 400
        image_path = save_image(file) if file else None
        category = Category(
            name=data['name'],
            type=data.get('type', ''),
            description=data.get('description', ''),
            image=image_path
        )
        db.session.add(category)
        db.session.commit()
        return jsonify({
            'category': category.to_dict(),
            'message': 'Category created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating category: {str(e)}'}), 500

@ecommerce_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        category = Category.query.get_or_404(category_id)
        data = request.form
        file = request.files.get('image')
        
        if 'name' in data:
            category.name = data['name']
        if 'type' in data:
            category.type = data['type']
        if 'description' in data:
            category.description = data['description']
        
        if file:
            category.image = save_image(file)
        
        db.session.commit()
        
        return jsonify({
            'category': category.to_dict(),
            'message': 'Category updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating category: {str(e)}'}), 500

@ecommerce_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    try:
        identity = json.loads(get_jwt_identity())
        user_type = identity.get('type')
        
        if user_type != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        category = Category.query.get_or_404(category_id)
        
        # Check if category has products
        if category.products:
            return jsonify({
                'message': 'Cannot delete category with existing products. Reassign products first.'
            }), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting category: {str(e)}'}), 500