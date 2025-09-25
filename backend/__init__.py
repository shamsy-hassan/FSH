from flask import Flask
from backend.config import config
from backend.extensions import db, jwt, mail

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    
    # Configure upload folder
    import os
    upload_folder = os.path.join(app.instance_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder
    
    # Register blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.user import user_bp
    from backend.routes.profile import profile_bp
    from backend.routes.admin import admin_bp
    from backend.routes.agroclimate import agroclimate_bp
    from backend.routes.ecommerce import ecommerce_bp
    from backend.routes.market import market_bp
    from backend.routes.order import order_bp
    from backend.routes.sacco import sacco_bp
    from backend.routes.skill import skill_bp
    from backend.routes.storage import storage_bp
    from backend.routes.message import message_bp
    
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
    
    return app