#backend/app.py
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from extensions import db, jwt, mail
from werkzeug.security import generate_password_hash

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Import config
    from config import Config
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.user import user_bp
    from routes.profile import profile_bp
    from routes.admin import admin_bp
    from routes.agroclimate import agroclimate_bp
    from routes.ecommerce import ecommerce_bp
    from routes.market import market_bp
    from routes.order import order_bp
    from routes.sacco import sacco_bp
    from routes.skill import skill_bp
    from routes.storage import storage_bp
    from routes.message import message_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(agroclimate_bp, url_prefix='/api/agroclimate')
    app.register_blueprint(ecommerce_bp, url_prefix='/api/ecommerce')
    app.register_blueprint(market_bp, url_prefix='/api/market')
    app.register_blueprint(order_bp, url_prefix='/api/order')
    app.register_blueprint(sacco_bp, url_prefix='/api/sacco')
    app.register_blueprint(skill_bp, url_prefix='/api/skill')
    app.register_blueprint(storage_bp, url_prefix='/api/storage')
    app.register_blueprint(message_bp, url_prefix='/api/message')
    
    # Initialize database and create admin user
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        
        # Import models here to avoid circular imports
        from models.admin import Admin
        from models.user import User
        from models.profile import UserProfile
        
        # Create default admin user if it doesn't exist
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(
                username='admin',
                email='admin@agriconnect.com',
                role='superadmin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created: username=admin, password=admin123")
        else:
            print("Admin user already exists")
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

app = create_app()
CORS(app)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)