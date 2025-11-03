import os
from datetime import timedelta

# load_dotenv() is now handled in __init__.py

class Config:
    """Base configuration shared by all environments."""
    SECRET_KEY = os.getenv('SECRET_KEY') # No default for production safety
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') # No default for production safety
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # --- JWT Configuration ---
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # --- Email Configuration ---
    # These can have defaults if you want, but reading from env is safer
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')


class DevelopmentConfig(Config):
    """Config for local development."""
    DEBUG = True
    # Fallback to a local database if DATABASE_URL is not in the .env file
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'mysql+mysqlconnector://root:@127.0.0.1/school_db'
    )

class ProductionConfig(Config):
    """Config for production environment."""
    DEBUG = False
    # In production, we REQUIRE the DATABASE_URL to be set in the environment.
    # The app will crash if it's not found, which is what we want for safety.
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')