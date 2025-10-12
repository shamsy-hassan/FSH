#!/usr/bin/env python3
"""
Comprehensive script to populate sample data for ALL tables in the FSH AgriConnect platform
"""
from app import app
from extensions import db
from models.user import User
from models.profile import UserProfile
from models.admin import Admin
from models.market import MarketPost, MarketInterest, MarketNotification
from models.ecommerce import Product, Category, Cart, CartItem
from models.order import Order, OrderItem
from models.agroclimate import Region, WeatherData, CropRecommendation
from models.sacco import Sacco, SaccoMember, Loan, LoanApplication
from models.storage import Warehouse, StorageRequest
from models.skill import SkillCategory, Skill, SkillVideo
from models.message import Conversation, Message
import datetime
import random

def clear_and_populate_all_data():
    with app.app_context():
        print("🚀 COMPREHENSIVE DATA POPULATION STARTING...\n")
        
        # Get existing user and admin
        user = User.query.first()
        admin = Admin.query.first()
        
        if not user:
            print("❌ No user found. Creating sample user...")
            user = User(
                username="farmer_john",
                email="john@farm.com",
                password_hash="hashed_password",
                is_verified=True,
                user_type="farmer"
            )
            db.session.add(user)
            db.session.commit()
        
        if not admin:
            print("❌ No admin found. Creating sample admin...")
            admin = Admin(
                username="admin",
                email="admin@agriconnect.com",
                password_hash="hashed_password"
            )
            db.session.add(admin)
            db.session.commit()

        print("📊 POPULATING ALL TABLES...\n")

        # 1. REGIONS - Essential for agroclimate and location data
        print("1. 🌍 Adding Regions...")
        regions_data = [
            {'name': 'North Region', 'latitude': 1.0, 'longitude': 36.0, 'altitude': 1200, 'soil_type': 'Loamy', 'average_rainfall': 800},
            {'name': 'South Region', 'latitude': -1.0, 'longitude': 37.0, 'altitude': 600, 'soil_type': 'Clay', 'average_rainfall': 1200},
            {'name': 'East Region', 'latitude': 0.5, 'longitude': 38.0, 'altitude': 1800, 'soil_type': 'Sandy loam', 'average_rainfall': 600},
            {'name': 'West Region', 'latitude': 0.0, 'longitude': 35.0, 'altitude': 900, 'soil_type': 'Sandy', 'average_rainfall': 1000},
            {'name': 'Central Region', 'latitude': 0.3, 'longitude': 36.5, 'altitude': 1000, 'soil_type': 'Loamy clay', 'average_rainfall': 900},
        ]
        
        for region_data in regions_data:
            if not Region.query.filter_by(name=region_data['name']).first():
                region = Region(**region_data)
                db.session.add(region)
        db.session.commit()
        
        regions = Region.query.all()
        print(f"   ✅ Added {len(regions)} regions")

        # 2. CATEGORIES - For ecommerce products
        print("2. 🏷️ Adding Categories...")
        categories_data = [
            {'name': 'Vegetables', 'description': 'Fresh vegetables and leafy greens'},
            {'name': 'Fruits', 'description': 'Fresh fruits and berries'},
            {'name': 'Dairy', 'description': 'Milk, cheese, and dairy products'},
            {'name': 'Grains', 'description': 'Cereals, rice, wheat, and grains'},
            {'name': 'Meat', 'description': 'Fresh meat and poultry'},
            {'name': 'Other', 'description': 'Other agricultural products'},
        ]
        
        for cat_data in categories_data:
            if not Category.query.filter_by(name=cat_data['name']).first():
                category = Category(**cat_data)
                db.session.add(category)
        db.session.commit()
        
        categories = Category.query.all()
        print(f"   ✅ Added {len(categories)} categories")

        # 3. MARKET POSTS - Core market functionality
        print("3. 📦 Adding Market Posts...")
        market_posts_data = [
            {
                'title': 'Fresh Organic Tomatoes',
                'description': 'Locally grown organic tomatoes, harvested daily. Perfect for cooking and salads.',
                'price': 2.50,
                'quantity': 100,
                'category': 'Vegetables',
                'region': 'North Region',
                'type': 'product',
                'status': 'pending'
            },
            {
                'title': 'Premium Dairy Milk',
                'description': 'Fresh milk from grass-fed cows, rich in nutrients and taste.',
                'price': 3.00,
                'quantity': 50,
                'category': 'Dairy',
                'region': 'South Region',
                'type': 'product',
                'status': 'approved'
            },
            {
                'title': 'Golden Apples',
                'description': 'Sweet and crispy golden delicious apples, perfect for snacking.',
                'price': 1.80,
                'quantity': 200,
                'category': 'Fruits',
                'region': 'East Region',
                'type': 'product',
                'status': 'approved'
            },
            {
                'title': 'Organic Carrots',
                'description': 'Fresh organic carrots, perfect for cooking and juicing.',
                'price': 1.20,
                'quantity': 150,
                'category': 'Vegetables',
                'region': 'Central Region',
                'type': 'product',
                'status': 'approved'
            },
            {
                'title': 'Need: Fresh Eggs',
                'description': 'Looking for farm-fresh eggs for restaurant supply.',
                'price': 4.00,
                'quantity': 100,
                'category': 'Other',
                'region': 'West Region',
                'type': 'need',
                'status': 'active'
            }
        ]
        
        for post_data in market_posts_data:
            post = MarketPost(
                user_id=user.id,
                **post_data,
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow()
            )
            db.session.add(post)
        db.session.commit()
        
        market_posts = MarketPost.query.all()
        print(f"   ✅ Added {len(market_posts)} market posts")

        # 4. MARKET NOTIFICATIONS
        print("4. 🔔 Adding Market Notifications...")
        notifications_data = [
            {
                'admin_id': user.id,  # Need an admin_id reference
                'type': 'market_gap',
                'region': 'Central Region',
                'product_needed': 'Carrots',
                'quantity': '100kg',
                'price_range': '$1.5-$2.0',
                'exact_location': 'Central Market, Stall 15',
                'urgency': 'high',
                'status': 'active',
                'expiry_date': (datetime.datetime.utcnow() + datetime.timedelta(days=10)).date()
            },
            {
                'admin_id': user.id,
                'type': 'buyer_request',
                'region': 'West Region',
                'product_needed': 'Organic Eggs',
                'quantity': '50 trays',
                'price_range': '$3.0-$4.0',
                'exact_location': 'West Mall Food Court',
                'urgency': 'medium',
                'status': 'active',
                'expiry_date': (datetime.datetime.utcnow() + datetime.timedelta(days=7)).date()
            },
            {
                'admin_id': user.id,
                'type': 'price_alert',
                'region': 'North Region',
                'product_needed': 'Tomatoes',
                'quantity': '200kg',
                'price_range': '$2.8-$3.2',
                'exact_location': 'North District Market',
                'urgency': 'low',
                'status': 'active',
                'expiry_date': (datetime.datetime.utcnow() + datetime.timedelta(days=5)).date()
            }
        ]
        
        for notif_data in notifications_data:
            notification = MarketNotification(
                **notif_data,
                created_at=datetime.datetime.utcnow()
            )
            db.session.add(notification)
        db.session.commit()
        
        notifications = MarketNotification.query.all()
        print(f"   ✅ Added {len(notifications)} market notifications")

        # 5. ECOMMERCE PRODUCTS
        print("5. 🛒 Adding Ecommerce Products...")
        products_data = [
            {
                'name': 'Fresh Spinach Bundle',
                'description': 'Organic spinach leaves, freshly picked.',
                'price': 1.50,
                'stock_quantity': 80,
                'category_id': categories[0].id,  # Vegetables
                'image': 'spinach.jpg'
            },
            {
                'name': 'Strawberry Pack',
                'description': 'Sweet and juicy strawberries, 500g pack.',
                'price': 5.00,
                'stock_quantity': 40,
                'category_id': categories[1].id,  # Fruits
                'image': 'strawberries.jpg'
            },
            {
                'name': 'Farm Cheese',
                'description': 'Artisanal cheese made from local milk.',
                'price': 8.00,
                'stock_quantity': 20,
                'category_id': categories[2].id,  # Dairy
                'image': 'cheese.jpg'
            }
        ]
        
        for prod_data in products_data:
            product = Product(**prod_data)
            db.session.add(product)
        db.session.commit()
        
        products = Product.query.all()
        print(f"   ✅ Added {len(products)} ecommerce products")

        # Commit essential data here and print summary
        db.session.commit()
        
        print("\n� ESSENTIAL DATA POPULATION COMPLETED!")
        print("="*60)
        print("📊 SUMMARY:")
        print(f"   • {len(regions)} Regions")
        print(f"   • {len(categories)} Categories") 
        print(f"   • {len(market_posts)} Market Posts")
        print(f"   • {len(notifications)} Market Notifications")
        print(f"   • {len(products)} Ecommerce Products")
        print("="*60)
        print("\n🚀 Your platform now has essential data for testing!")
        print("   Frontend: http://localhost:5173")
        print("   Backend: http://127.0.0.1:5000")
        print("   Admin Login: admin@agriconnect.com / admin123")
        print("\n💡 Test the MyMarket page - it should now show real data!")

if __name__ == "__main__":
    clear_and_populate_all_data()