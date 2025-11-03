import os
from dotenv import load_dotenv
from datetime import timedelta # Import timedelta

# Load variables from .env file
load_dotenv()

class Config:
    """Base configuration shared by all environments."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev_jwt_key')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'mysql+mysqlconnector://root@127.0.0.1/school_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # --- JWT Configuration ---
    JWT_TOKEN_LOCATION = ["headers"]
    # Use timedelta for consistency. This will now be the single source of truth.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # --- Email Configuration ---
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')


class DevelopmentConfig(Config):
    """Config for local development."""
    DEBUG = True

class ProductionConfig(Config):
    """Config for production environment."""
    DEBUG = False