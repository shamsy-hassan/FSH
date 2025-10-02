# backend/routes/dashboard.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.profile import UserProfile
from models.market import MarketPost
from models.order import Order
from models.sacco import SaccoMember, LoanApplication
from models.message import Message
from models.agroclimate import WeatherData, Region
from models.ecommerce import Product
from extensions import db
import json
from datetime import date, datetime, timedelta
from sqlalchemy import func, desc

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/user/overview', methods=['GET'])
@jwt_required()
def get_user_dashboard():
    """Get comprehensive user dashboard data"""
    try:
        identity = json.loads(get_jwt_identity())
        user_id = identity['id']
        
        # Get user profile
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        # Get basic counts with error handling
        try:
            market_posts = MarketPost.query.filter_by(farmer_id=user_id).count()
        except:
            market_posts = 0
            
        try:
            orders = Order.query.filter_by(buyer_id=user_id).count()
        except:
            orders = 0
            
        try:
            sacco_member = SaccoMember.query.filter_by(user_id=user_id).first()
            loan_applications = LoanApplication.query.filter_by(member_id=sacco_member.id).count() if sacco_member else 0
        except:
            loan_applications = 0
            
        try:
            unread_messages = Message.query.filter(
                Message.receiver_id == user_id,
                Message.is_read == False
            ).count()
        except:
            unread_messages = 0
        
        # Quick stats
        activities = [
            {
                'title': 'Market Posts',
                'count': market_posts,
                'recent': 0,
                'icon': '🌾',
                'color': 'green',
                'link': '/market'
            },
            {
                'title': 'Orders Placed',
                'count': orders,
                'recent': 0,
                'icon': '🛒',
                'color': 'blue',
                'link': '/ecommerce'
            },
            {
                'title': 'Loan Applications',
                'count': loan_applications,
                'recent': 0,
                'icon': '💰',
                'color': 'yellow',
                'link': '/sacco'
            },
            {
                'title': 'Messages',
                'count': unread_messages,
                'recent': unread_messages,
                'icon': '💬',
                'color': 'purple',
                'link': '/communicate'
            }
        ]
        
        # Recent activities (simplified)
        recent_activities = [
            {
                'type': 'welcome',
                'title': 'Welcome to AgriConnect!',
                'description': 'Start exploring our features',
                'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'icon': '🎉'
            }
        ]
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{profile.first_name} {profile.last_name}" if profile and profile.first_name else user.username,
                'first_name': profile.first_name if profile and profile.first_name else user.username.split()[0] if user.username else 'User',
                'profile_picture': profile.profile_picture if profile else None,
                'member_since': user.created_at.strftime('%B %Y') if hasattr(user, 'created_at') and user.created_at else 'Recently',
                'location': profile.location if profile and hasattr(profile, 'location') else 'Not specified'
            },
            'activities': activities,
            'recent_activities': recent_activities,
            'policies': [
                {
                    'title': 'Privacy Policy',
                    'description': 'Learn how we protect your data',
                    'link': '/privacy',
                    'icon': '🔒'
                },
                {
                    'title': 'Terms of Service',
                    'description': 'Platform usage guidelines',
                    'link': '/terms',
                    'icon': '�'
                },
                {
                    'title': 'Community Guidelines',
                    'description': 'Rules for respectful interaction',
                    'link': '/guidelines',
                    'icon': '👥'
                }
            ],
            'features': [
                {
                    'title': 'Marketplace',
                    'description': 'Buy and sell agricultural products',
                    'link': '/market',
                    'icon': '🌾'
                },
                {
                    'title': 'E-Commerce',
                    'description': 'Online shopping for farm supplies',
                    'link': '/ecommerce',
                    'icon': '🛒'
                },
                {
                    'title': 'SACCO Services',
                    'description': 'Financial services and loans',
                    'link': '/sacco',
                    'icon': '💰'
                },
                {
                    'title': 'AgriClimate',
                    'description': 'Weather and crop recommendations',
                    'link': '/agroclimate',
                    'icon': '🌤️'
                }
            ]
        })
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/admin/overview', methods=['GET'])
@jwt_required()
def get_admin_dashboard():
    """Get comprehensive admin dashboard data"""
    try:
        identity = json.loads(get_jwt_identity())
        if identity['type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        admin_id = identity['id']
        admin = User.query.get(admin_id)
        if not admin:
            return jsonify({'error': 'Admin user not found'}), 404
            
        admin_profile = UserProfile.query.filter_by(user_id=admin_id).first()
        
        # Get system statistics with error handling
        try:
            total_users = User.query.filter_by(user_type='user').count()
        except:
            total_users = 0
            
        try:
            total_market_posts = MarketPost.query.count()
        except:
            total_market_posts = 0
            
        try:
            total_orders = Order.query.count()
        except:
            total_orders = 0
            
        try:
            total_products = Product.query.count()
        except:
            total_products = 0
        
        # System health metrics
        system_metrics = [
            {
                'title': 'Total Users',
                'count': total_users,
                'recent': 0,
                'icon': '👥',
                'color': 'blue',
                'link': '/admin/manage-users'
            },
            {
                'title': 'Market Posts',
                'count': total_market_posts,
                'recent': 0,
                'icon': '🌾',
                'color': 'green',
                'link': '/admin/manage-market'
            },
            {
                'title': 'Orders',
                'count': total_orders,
                'recent': 0,
                'icon': '📦',
                'color': 'orange',
                'link': '/admin/manage-orders'
            },
            {
                'title': 'Products',
                'count': total_products,
                'recent': 0,
                'icon': '🛍️',
                'color': 'purple',
                'link': '/admin/manage-ecommerce'
            }
        ]
        
        # Simple pending actions
        pending_actions = [
            {
                'type': 'system',
                'title': 'System Monitoring',
                'description': 'Monitor platform health and performance',
                'urgency': 'low',
                'link': '/admin/system',
                'icon': '⚙️'
            }
        ]
        
        # System policies
        policies = [
            {
                'title': 'Admin Guidelines',
                'description': 'Administrative procedures and policies',
                'status': 'active',
                'last_updated': '2025-09-01',
                'icon': '📋'
            },
            {
                'title': 'User Management Policy',
                'description': 'Guidelines for managing user accounts',
                'status': 'active', 
                'last_updated': '2025-08-15',
                'icon': '👥'
            },
            {
                'title': 'Data Protection Policy',
                'description': 'User data protection and privacy measures',
                'status': 'active',
                'last_updated': '2025-07-20',
                'icon': '🔒'
            }
        ]
        
        return jsonify({
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email,
                'full_name': f"{admin_profile.first_name} {admin_profile.last_name}" if admin_profile and admin_profile.first_name else admin.username,
                'first_name': admin_profile.first_name if admin_profile and admin_profile.first_name else admin.username.split()[0] if admin.username else 'Admin',
                'profile_picture': admin_profile.profile_picture if admin_profile else None,
                'admin_since': admin.created_at.strftime('%B %Y') if hasattr(admin, 'created_at') and admin.created_at else 'Recently'
            },
            'system_metrics': system_metrics,
            'pending_actions': pending_actions,
            'policies': policies,
            'system_health': {
                'total_users': total_users,
                'total_admins': 1,
                'active_sessions': total_users,
                'system_status': 'healthy'
            }
        })
        
    except Exception as e:
        print(f"Admin dashboard error: {e}")
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/policies', methods=['GET'])
def get_policies():
    """Get website policies and terms"""
    policies = [
        {
            'id': 1,
            'title': 'Terms of Service',
            'description': 'Rules and regulations for using FSH AgriConnect platform',
            'content': '''
## Terms of Service

### 1. Platform Usage
- Users must provide accurate information during registration
- All agricultural products must be genuine and properly described
- Market prices should reflect fair market value

### 2. Trading Guidelines
- All transactions must be conducted transparently
- Quality disputes will be mediated by platform administrators
- Payment terms must be honored by all parties

### 3. User Responsibilities
- Maintain respectful communication
- Report suspicious activities
- Comply with local agricultural regulations

### 4. Platform Rights
- FSH AgriConnect reserves the right to moderate content
- Suspend accounts for policy violations
- Update terms as needed
            ''',
            'effective_date': '2025-01-01',
            'category': 'legal'
        },
        {
            'id': 2,
            'title': 'Privacy Policy',
            'description': 'How we collect, use, and protect your personal information',
            'content': '''
## Privacy Policy

### Data Collection
- Personal information (name, email, phone)
- Agricultural activity data
- Location information for market purposes
- Communication records

### Data Usage
- Improve platform services
- Facilitate agricultural trading
- Provide weather and climate information
- Enable secure financial transactions

### Data Protection
- Encrypted data transmission
- Secure server storage
- Limited access controls
- Regular security audits
            ''',
            'effective_date': '2025-01-01',
            'category': 'privacy'
        },
        {
            'id': 3,
            'title': 'SACCO Financial Guidelines',
            'description': 'Rules and procedures for savings and credit services',
            'content': '''
## SACCO Financial Guidelines

### Membership Requirements
- Active platform user for minimum 30 days
- Verified agricultural activities
- Completed profile information

### Loan Policies
- Maximum loan amount based on savings history
- Competitive interest rates
- Flexible repayment terms
- Collateral requirements for large loans

### Savings Benefits
- Competitive interest on savings
- Group savings incentives
- Financial literacy support
            ''',
            'effective_date': '2025-01-01',
            'category': 'financial'
        }
    ]
    
    return jsonify({'policies': policies})

@dashboard_bp.route('/features', methods=['GET'])
def get_platform_features():
    """Get platform features and capabilities"""
    features = [
        {
            'id': 1,
            'title': 'Agricultural Marketplace',
            'description': 'Buy and sell agricultural products directly with other farmers',
            'icon': '🌾',
            'status': 'active',
            'benefits': [
                'Direct farmer-to-farmer trading',
                'Fair market pricing',
                'Quality assurance',
                'Location-based matching'
            ],
            'link': '/market'
        },
        {
            'id': 2,
            'title': 'E-Commerce Platform',
            'description': 'Online store for agricultural products and farming supplies',
            'icon': '🛒',
            'status': 'active',
            'benefits': [
                'Wide product selection',
                'Secure payment processing',
                'Inventory management',
                'Order tracking'
            ],
            'link': '/ecommerce'
        },
        {
            'id': 3,
            'title': 'SACCO Financial Services',
            'description': 'Savings and credit cooperative for agricultural financing',
            'icon': '💰',
            'status': 'active',
            'benefits': [
                'Competitive loan rates',
                'Group savings plans',
                'Financial literacy training',
                'Agricultural insurance'
            ],
            'link': '/sacco'
        },
        {
            'id': 4,
            'title': 'AgriClimate Intelligence',
            'description': 'Weather data and climate insights for better farming decisions',
            'icon': '🌤️',
            'status': 'active',
            'benefits': [
                'Real-time weather data',
                'Crop recommendations',
                'Climate trend analysis',
                'Seasonal planning tools'
            ],
            'link': '/agroclimate'
        },
        {
            'id': 5,
            'title': 'Smart Storage Solutions',
            'description': 'Warehouse and storage management for agricultural products',
            'icon': '🏭',
            'status': 'active',
            'benefits': [
                'Climate-controlled storage',
                'Inventory tracking',
                'Quality preservation',
                'Logistics coordination'
            ],
            'link': '/storage'
        },
        {
            'id': 6,
            'title': 'Skill Development',
            'description': 'Training programs and courses for agricultural improvement',
            'icon': '📚',
            'status': 'active',
            'benefits': [
                'Expert-led courses',
                'Practical training modules',
                'Certification programs',
                'Peer learning networks'
            ],
            'link': '/skills'
        }
    ]
    
    return jsonify({'features': features})