from flask import Blueprint, jsonify
from app.models import db
from app.models.staff_model import Staff
from app.models.notification_model import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_email = get_jwt_identity()
    staff = Staff.query.filter_by(email=current_user_email).first()
    if not staff:
        return jsonify({"error": "Staff member not found"}), 404
        
    # Fetch unread notifications, most recent first
    notifications = Notification.query.filter_by(staff_id=staff.id, is_read=False).order_by(Notification.created_at.desc()).all()
    
    return jsonify([n.to_dict() for n in notifications]), 200

@notification_bp.route('/mark-all-as-read', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    current_user_email = get_jwt_identity()
    staff = Staff.query.filter_by(email=current_user_email).first()
    if not staff:
        return jsonify({"error": "Staff member not found"}), 404

    Notification.query.filter_by(staff_id=staff.id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return jsonify({"message": "All notifications marked as read"}), 200