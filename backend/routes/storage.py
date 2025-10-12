# backend/routes/storage.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.storage import Warehouse, StorageRequest, StorageTransaction
from extensions import db, allowed_file
from decimal import Decimal
import datetime
import json   # ✅ added
import os
import uuid
from werkzeug.utils import secure_filename

storage_bp = Blueprint('storage', __name__)


@storage_bp.route('/warehouses', methods=['GET'])
def get_warehouses():
    region = request.args.get('region')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Warehouse.query.filter_by(is_active=True)
    if region:
        query = query.filter_by(region=region)
    
    warehouses = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'warehouses': [warehouse.to_dict() for warehouse in warehouses.items],
        'total': warehouses.total,
        'pages': warehouses.pages,
        'current_page': page
    })


@storage_bp.route('/warehouses/<int:warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    return jsonify(warehouse.to_dict())


@storage_bp.route('/warehouses', methods=['POST'])
@jwt_required()
def create_warehouse():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Handle both JSON and FormData
    if request.content_type and 'multipart/form-data' in request.content_type:
        # FormData (with file upload)
        data = request.form.to_dict()
        image_file = request.files.get('image')
    else:
        # JSON data (backward compatibility)
        data = request.get_json()
        image_file = None
    
    try:
        # Handle image upload
        image_path = None
        if image_file and image_file.filename and allowed_file(image_file.filename):
            # Generate unique filename
            filename = secure_filename(image_file.filename)
            unique_filename = str(uuid.uuid4())[:8] + '.' + filename.rsplit('.', 1)[1].lower()
            
            # Save file
            upload_path = os.path.join('static', 'uploads', unique_filename)
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            image_file.save(upload_path)
            image_path = upload_path

        # Create new warehouse
        warehouse = Warehouse(
            name=data['name'],
            location=data['location'],
            region=data['region'],
            capacity=float(data['capacity']),
            available_capacity=float(data['capacity']),  # Default to full capacity
            temperature_control=False,  # Default to False since we removed it
            humidity_control=False,  # Default to False since we removed it
            security_level=data.get('security_level', 'standard'),
            owner=data.get('owner', ''),
            contact_info=data.get('contact_info', ''),
            description=data.get('description', ''),
            rates='{}',  # Default empty JSON since we removed it
            image_path=image_path
        )
        
        db.session.add(warehouse)
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse created successfully',
            'warehouse': warehouse.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating warehouse: {str(e)}'}), 400


@storage_bp.route('/warehouses/<int:warehouse_id>', methods=['PUT'])
@jwt_required()
def update_warehouse(warehouse_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    data = request.get_json()
    
    try:
        # Update warehouse fields
        warehouse.name = data.get('name', warehouse.name)
        warehouse.location = data.get('location', warehouse.location)
        warehouse.region = data.get('region', warehouse.region)
        warehouse.capacity = float(data.get('capacity', warehouse.capacity))
        warehouse.available_capacity = float(data.get('available_capacity', warehouse.available_capacity))
        warehouse.temperature_control = bool(data.get('temperature_control', warehouse.temperature_control))
        warehouse.humidity_control = bool(data.get('humidity_control', warehouse.humidity_control))
        warehouse.security_level = data.get('security_level', warehouse.security_level)
        warehouse.owner = data.get('owner', warehouse.owner)
        warehouse.contact_info = data.get('contact_info', warehouse.contact_info)
        warehouse.rates = data.get('rates', warehouse.rates)
        warehouse.is_active = bool(data.get('is_active', warehouse.is_active))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse updated successfully',
            'warehouse': warehouse.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating warehouse: {str(e)}'}), 400


@storage_bp.route('/storage-requests', methods=['POST'])
@jwt_required()
def create_storage_request():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    data = request.get_json()
    
    # Get warehouse
    warehouse = Warehouse.query.get(data['warehouse_id'])
    if not warehouse:
        return jsonify({'message': 'Warehouse not found'}), 404
    
    # Calculate cost based on rates
    rates = json.loads(warehouse.rates) if warehouse.rates else {}
    daily_rate_str = rates.get(data['product_type'], '0')
    
    # Convert string rate to Decimal, handling both string and number types
    try:
        daily_rate = Decimal(str(daily_rate_str))
    except (ValueError, TypeError):
        daily_rate = Decimal('0')
    
    # Ensure duration is also converted to Decimal for consistent calculation
    try:
        duration = Decimal(str(data['duration']))
        quantity = Decimal(str(data['quantity']))
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid quantity or duration format'}), 400
    
    total_cost = daily_rate * quantity * duration
    
    # Create storage request
    try:
        start_date = datetime.datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    except (ValueError, KeyError):
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    storage_request = StorageRequest(
        user_id=user_id,
        warehouse_id=data['warehouse_id'],
        product_type=data['product_type'],
        quantity=float(quantity),  # Convert back to float for storage
        duration=int(duration),    # Convert to int for storage
        start_date=start_date,
        end_date=end_date,
        special_requirements=data.get('special_requirements', ''),
        total_cost=float(total_cost)  # Convert back to float for storage
    )
    
    db.session.add(storage_request)
    db.session.commit()
    
    return jsonify({
        'message': 'Storage request submitted successfully',
        'request': storage_request.to_dict()
    }), 201


@storage_bp.route('/storage-requests', methods=['GET'])
@jwt_required()
def get_storage_requests():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') == 'user':
        user_id = identity['id']
        requests = StorageRequest.query.filter_by(user_id=user_id).all()
    elif identity.get('type') == 'admin':
        warehouse_id = request.args.get('warehouse_id')
        if warehouse_id:
            requests = StorageRequest.query.filter_by(warehouse_id=warehouse_id).all()
        else:
            requests = StorageRequest.query.all()
    else:
        return jsonify({'message': 'Unauthorized'}), 403
    
    return jsonify({
        'requests': [req.to_dict() for req in requests]
    })


@storage_bp.route('/storage-requests/<int:request_id>/status', methods=['PUT'])
@jwt_required()
def update_storage_request_status(request_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    storage_request = StorageRequest.query.get_or_404(request_id)
    data = request.get_json()
    
    storage_request.status = data['status']
    if data['status'] == 'approved':
        storage_request.approved_at = datetime.datetime.utcnow()
        
        # Update warehouse available capacity
        warehouse = storage_request.warehouse
        warehouse.available_capacity -= storage_request.quantity
        
        # Create transaction record
        transaction = StorageTransaction(
            storage_request_id=storage_request.id,
            transaction_type='deposit',
            amount=storage_request.total_cost,
            description=f'Storage deposit for {storage_request.quantity} tons of {storage_request.product_type}'
        )
        db.session.add(transaction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Storage request status updated successfully',
        'request': storage_request.to_dict()
    })
