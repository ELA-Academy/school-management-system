import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from app.models import db, init_db
from app.config import DevelopmentConfig, ProductionConfig # Import both configs

mail = Mail()

def create_app():
    app = Flask(__name__)

    # Check the FLASK_ENV environment variable to decide which config to use.
    # On PythonAnywhere, we set this to 'production' in the postactivate script.
    # Locally, it will be unset, so it will fall back to DevelopmentConfig.
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)


    # Initialize extensions AFTER config is loaded.
    # We will update the origins list later with your live Vercel URL.
    CORS(
        app, 
        resources={r"/api/*": {"origins": "http://localhost:5173"}}, 
        supports_credentials=True,
        allow_headers=["Authorization", "Content-Type"]
    )
    
    # Initialize JWTManager directly with the app object.
    jwt = JWTManager(app)
    
    mail.init_app(app)
    init_db(app)
    Migrate(app, db)

    # This helps diagnose token issues in the future.
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "Token has expired", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Signature verification failed", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Request does not contain an access token", "error": "authorization_required"}), 401


    # Register blueprints LAST.
    from app.routes import register_blueprints
    register_blueprints(app)

    # Root route
    @app.route('/')
    def home():
        return {"message": "School Management API is running successfully!"}

    return app