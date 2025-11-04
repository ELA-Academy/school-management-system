from flask import Blueprint, request, jsonify, current_app
from app.models import db
from app.models.super_admin_model import SuperAdmin
from app.models.department_model import Department # Import the Department model
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta, datetime, timezone
from app.utils.email_otp import generate_otp, send_otp_email
from app import mail
import os

# Temporary storage for OTP and registration data.
registration_requests = {}

super_admin_bp = Blueprint('super_admin_auth', __name__)

@super_admin_bp.route('/check', methods=['GET'])
def check_super_admin():
    """Checks if a Super Admin account already exists."""
    exists = SuperAdmin.query.first() is not None
    return jsonify({"super_admin_exists": exists})


@super_admin_bp.route('/register', methods=['POST'])
def register_super_admin_request():
    # This function remains unchanged
    if SuperAdmin.query.first():
        return jsonify({"error": "A Super Admin account already exists."}), 409

    allowed_email = os.getenv('SUPER_ADMIN_EMAIL')
    if not allowed_email:
        current_app.logger.error("SUPER_ADMIN_EMAIL is not set in the environment.")
        return jsonify({"error": "Server configuration error: Super Admin email not defined."}), 500

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required."}), 400

    if email.lower() != allowed_email.lower():
        return jsonify({"error": "This email address is not authorized for Super Admin setup."}), 403

    otp = generate_otp()
    
    registration_requests[email] = {
        'otp': otp,
        'data': {'name': name, 'email': email, 'password': password},
        'timestamp': datetime.now(timezone.utc)
    }

    if not send_otp_email(mail, email, otp):
        return jsonify({"error": "Failed to send verification email. Please check the server configuration."}), 500

    return jsonify({"message": f"A verification code has been sent to {email}."}), 200


@super_admin_bp.route('/verify', methods=['POST'])
def verify_and_create_super_admin():
    """Verifies the OTP and creates the Super Admin account AND default departments."""
    if SuperAdmin.query.first():
        return jsonify({"error": "A Super Admin account already exists."}), 409

    data = request.get_json()
    email = data.get('email')
    otp_received = data.get('otp')

    if not all([email, otp_received]):
        return jsonify({"error": "Email and OTP are required."}), 400

    request_data = registration_requests.get(email)

    if not request_data:
        return jsonify({"error": "Invalid request or session expired. Please try registering again."}), 400

    if (datetime.now(timezone.utc) - request_data['timestamp']) > timedelta(minutes=10):
        del registration_requests[email]
        return jsonify({"error": "OTP has expired. Please try registering again."}), 400

    if request_data['otp'] != otp_received:
        return jsonify({"error": "Invalid verification code."}), 400

    admin_data = request_data['data']
    new_admin = SuperAdmin(name=admin_data['name'], email=admin_data['email'])
    new_admin.set_password(admin_data['password'])
    db.session.add(new_admin)

    # --- THIS IS THE NEW LOGIC ---
    # Create the default system departments at the same time as the Super Admin
    admissions = Department(
        name='Admission Department',
        description='Handles new student applications and leads.',
        dashboard_route='/admin/admissions'
    )
    accounting = Department(
        name='Accounting Department',
        description='Manages finances, payments, and invoices.',
        dashboard_route='/admin/accounting'
    )
    administration = Department(
        name='Administration Department',
        description='General school administration and other operational tasks.',
        dashboard_route='/admin/administration'
    )
    # Add all new departments to the session
    db.session.add_all([admissions, accounting, administration])
    # --- END OF NEW LOGIC ---

    # This one commit saves the Super Admin AND all three departments at once
    db.session.commit()

    del registration_requests[email]

    return jsonify({"message": "Super Admin account and default departments created successfully!"}), 201


@super_admin_bp.route('/login', methods=['POST'])
def login_super_admin():
    # This function remains unchanged
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    admin = SuperAdmin.query.filter_by(email=email).first()
    if not admin or not admin.check_password(password):
        return jsonify({"msg": "Invalid email or password."}), 401
    
    additional_claims = {
        "id": admin.id,
        "role": "superadmin",
        "name": admin.name
    }
    access_token = create_access_token(identity=admin.email, additional_claims=additional_claims)

    return jsonify({
        "access_token": access_token
    }), 200


@super_admin_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_super_admin_profile():
    # This function remains unchanged
    current_admin_email = get_jwt_identity()
    admin = SuperAdmin.query.filter_by(email=current_admin_email).first()

    if not admin:
        return jsonify({"error": "Admin not found."}), 404

    return jsonify({
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": "superadmin"
    }), 200