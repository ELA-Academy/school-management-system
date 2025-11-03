from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from app.models import db, init_db
from app.config import DevelopmentConfig

mail = Mail()
# We do not initialize JWTManager globally anymore to avoid context issues.

def create_app():
    app = Flask(__name__)

    # 1. Load configuration from config.py FIRST.
    # This is the most critical step.
    app.config.from_object(DevelopmentConfig)


    # 2. Initialize extensions AFTER config is loaded.
    CORS(
        app, 
        resources={r"/api/*": {"origins": "http://localhost:5173"}}, 
        supports_credentials=True,
        allow_headers=["Authorization", "Content-Type"]
    )
    
    # Initialize JWTManager directly with the app object.
    # Now it is guaranteed to have the configuration loaded.
    jwt = JWTManager(app)
    
    mail.init_app(app)
    init_db(app)
    Migrate(app, db) # Simplified migrate initialization

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


    # 3. Register blueprints LAST.
    # This ensures all extensions are configured before routes are registered.
    from app.routes import register_blueprints
    register_blueprints(app)

    # Root route
    @app.route('/')
    def home():
        return {"message": "School Management API is running successfully!"}

    return app