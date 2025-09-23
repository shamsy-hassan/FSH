# backend/routes/message.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.message import Conversation, Message
from models.user import User
from models.admin import Admin
from extensions import db
import datetime
import json   # ✅ added

message_bp = Blueprint('message', __name__)


@message_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    user_id = identity['id']
    user_type = identity['type']
    
    if user_type == 'user':
        conversations = Conversation.query.filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).all()
    elif user_type == 'admin':
        # Admin can see all conversations
        conversations = Conversation.query.all()
    else:
        return jsonify({'message': 'Invalid user type'}), 403
    
    return jsonify({
        'conversations': [conv.to_dict() for conv in conversations]
    })


@message_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    if identity.get('type') != 'user':
        return jsonify({'message': 'User access required'}), 403
    
    user_id = identity['id']
    data = request.get_json()
    receiver_id = data['receiver_id']
    
    # Check if conversation already exists
    conversation = Conversation.query.filter(
        ((Conversation.user1_id == user_id) & (Conversation.user2_id == receiver_id)) |
        ((Conversation.user1_id == receiver_id) & (Conversation.user2_id == user_id))
    ).first()
    
    if not conversation:
        conversation = Conversation(user1_id=user_id, user2_id=receiver_id)
        db.session.add(conversation)
        db.session.commit()
    
    return jsonify(conversation.to_dict())


@message_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    user_id = identity['id']
    
    conversation = Conversation.query.get_or_404(conversation_id)
    
    # Check authorization
    if identity.get('type') == 'user' and user_id not in [conversation.user1_id, conversation.user2_id]:
        return jsonify({'message': 'Not authorized to view this conversation'}), 403
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.sent_at.asc()).all()
    
    return jsonify({
        'messages': [msg.to_dict() for msg in messages]
    })


@message_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    user_id = identity['id']
    user_type = identity['type']
    
    conversation = Conversation.query.get_or_404(conversation_id)
    
    # Check authorization
    if user_type == 'user' and user_id not in [conversation.user1_id, conversation.user2_id]:
        return jsonify({'message': 'Not authorized to send messages in this conversation'}), 403
    
    data = request.get_json()
    
    # Determine receiver
    if user_id == conversation.user1_id:
        receiver_id = conversation.user2_id
    else:
        receiver_id = conversation.user1_id
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=user_id,
        receiver_id=receiver_id,
        content=data['content']
    )
    
    db.session.add(message)
    conversation.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully',
        'message_data': message.to_dict()
    }), 201


@message_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_as_read(message_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)

    user_id = identity['id']
    
    message = Message.query.get_or_404(message_id)
    
    # Check if user is the receiver
    if message.receiver_id != user_id:
        return jsonify({'message': 'Not authorized to mark this message as read'}), 403
    
    message.is_read = True
    message.read_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Message marked as read'})
