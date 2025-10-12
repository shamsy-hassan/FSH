# backend/models/__init__.py
from extensions import db

# Core models
from .user import User
from .admin import Admin
from .profile import UserProfile

# E-commerce models (Categories, Products, Cart)
from .ecommerce import Category, Product, Cart, CartItem

# Order models (separate from e-commerce)
from .order import Order, OrderItem, OrderStatus

# Import other modules
try:
    from .market import MarketPost, MarketInterest, ProductRequest, DeliveryDetails, MarketNotification, MarketDemand
except ImportError:
    pass

try:
    from .sacco import Sacco, LoanApplication, Membership
except ImportError:
    pass

__all__ = [
    'User', 'Admin', 'UserProfile',
    'Category', 'Product', 'Cart', 'CartItem',
    'Order', 'OrderItem', 'OrderStatus',
    'MarketPost', 'MarketCategory',
    'Sacco', 'LoanApplication', 'Membership'
]

# Create all tables function
def create_tables():
    """Create all database tables"""
    db.create_all()

def seed_sample_data():
    """Seed sample data for all modules"""
    from .ecommerce import seed_sample_data as seed_ecommerce
    try:
        from .market import seed_sample_data as seed_market
        seed_market()
    except:
        pass
    try:
        from .sacco import seed_sample_data as seed_sacco
        seed_sacco()
    except:
        pass
    seed_ecommerce()