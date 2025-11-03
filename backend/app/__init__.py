import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from app.models import db, init_db
from app.config import DevelopmentConfig, ProductionConfig
from dotenv import load_dotenv

mail = Mail()

def create_app():
    app = Flask(__name__)

    # --- THIS IS THE FINAL, ROBUST FIX ---
    # Determine the environment and load the correct .env file.
    # We will set FLASK_ENV to 'production' in our production.env file.
    # On your local machine, FLASK_ENV will be None, so it will load the default '.env'.
    
    # Check for a specific production environment file first
    prod_env_path = os.path.join(os.path.dirname(__file__), '..', 'production.env')
    if os.path.exists(prod_env_path):
        load_dotenv(dotenv_path=prod_env_path)
        app.config.from_object(ProductionConfig)
    else:
        # Fallback to local development .env file
        load_dotenv()
        app.config.from_object(DevelopmentConfig)
    # --- END OF FINAL FIX ---


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