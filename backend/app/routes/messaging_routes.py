from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db
from app.models.staff_model import Staff
from app.models.super_admin_model import SuperAdmin
from app.models.conversation_model import Conversation, Message, StaffMessage, SuperAdminMessage, ConversationParticipant
from app.models.notification_model import Notification
from app.utils.notifications import send_email_in_background, send_push_notification
from sqlalchemy import and_, or_, func
from datetime import datetime, timezone, timedelta
import json
import os

messaging_bp = Blueprint('messaging', __name__)

def get_current_user():
    claims = get_jwt()
    email = get_jwt_identity()
    role = claims.get('role')
    user = None
    if role == 'superadmin':
        user = SuperAdmin.query.filter_by(email=email).first()
    elif role == 'staff':
        user = Staff.query.filter_by(email=email).first()
    return user, role

@messaging_bp.route('/conversations/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get the total number of unread messages for the current user."""
    user, role = get_current_user()
    if not user:
        return jsonify({"count": 0}), 200

    total_unread = 0
    for conv in user.conversations:
        participant_entry = ConversationParticipant.query.filter_by(
            conversation_id=conv.id,
            staff_id=user.id if role == 'staff' else None,
            super_admin_id=user.id if role == 'superadmin' else None
        ).first()

        last_read_at = participant_entry.last_read_at if participant_entry else datetime.min.replace(tzinfo=timezone.utc)

        unread_in_conv = db.session.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id,
            Message.created_at > last_read_at,
            or_(Message.sender_type != role, Message.sender_id != user.id)
        ).scalar()
        total_unread += unread_in_conv

    return jsonify({"count": total_unread}), 200

@messaging_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users_for_messaging():
    current_user, role = get_current_user()
    users = []
    current_user_staff_id = current_user.id if role == 'staff' else None
    current_user_admin_id = current_user.id if role == 'superadmin' else None
    all_staff = Staff.query.filter(Staff.id != current_user_staff_id).all()
    for staff in all_staff:
        users.append({'id': f'staff_{staff.id}', 'name': staff.name, 'role': 'Staff'})
    all_super_admins = SuperAdmin.query.filter(SuperAdmin.id != current_user_admin_id).all()
    for admin in all_super_admins:
        users.append({'id': f'superadmin_{admin.id}', 'name': admin.name, 'role': 'Super Admin'})
    return jsonify(users), 200

@messaging_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user, role = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user_conversations = user.conversations
    response_data = []
    for conv in user_conversations:
        participants = [p for p in conv.get_participants() if p.id != user.id or p.__class__.__name__.lower() != role]
        participant_names = ", ".join([p.name for p in participants]) or "Yourself"
        last_message = conv.messages.order_by(db.desc(Message.created_at)).first()
        participant_entry = ConversationParticipant.query.filter_by(
            conversation_id=conv.id,
            staff_id=user.id if role == 'staff' else None,
            super_admin_id=user.id if role == 'superadmin' else None
        ).first()
        last_read_at = participant_entry.last_read_at if participant_entry else datetime.min.replace(tzinfo=timezone.utc)
        unread_count = db.session.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.created_at > last_read_at,
            or_(Message.sender_type != role, Message.sender_id != user.id)
        ).count()
        response_data.append({
            'id': conv.id,
            'participant_names': participant_names,
            'last_message': last_message.content if last_message else "No messages yet.",
            'last_message_time': last_message.created_at.isoformat() + 'Z' if last_message else conv.created_at.isoformat() + 'Z',
            'unread_count': unread_count
        })
    response_data.sort(key=lambda x: x['last_message_time'], reverse=True)
    return jsonify(response_data), 200

@messaging_bp.route('/conversations', methods=['POST'])
@jwt_required()
def start_conversation():
    user, role = get_current_user()
    data = request.get_json()
    participant_ids = data.get('participant_ids', [])
    if not participant_ids:
        return jsonify({'error': 'No participants provided'}), 400
    new_conv = Conversation()
    if role == 'superadmin':
        new_conv.participants.append(ConversationParticipant(super_admin=user))
    else:
        new_conv.participants.append(ConversationParticipant(staff=user))
    for pid in participant_ids:
        p_role, p_id_str = pid.split('_')
        p_id = int(p_id_str)
        if p_role == 'staff':
            participant = Staff.query.get(p_id)
            if participant: new_conv.participants.append(ConversationParticipant(staff=participant))
        elif p_role == 'superadmin':
            participant = SuperAdmin.query.get(p_id)
            if participant: new_conv.participants.append(ConversationParticipant(super_admin=participant))
    db.session.add(new_conv)
    db.session.commit()
    return jsonify({'message': 'Conversation created', 'conversation_id': new_conv.id}), 201

@messaging_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    user, role = get_current_user()
    conv = Conversation.query.get_or_404(conversation_id)
    is_participant = any(p for p in user.conversations if p.id == conversation_id)
    if not is_participant:
        return jsonify({"error": "Forbidden"}), 403
    messages = conv.messages.all()
    participant_entry = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        staff_id=user.id if role == 'staff' else None,
        super_admin_id=user.id if role == 'superadmin' else None
    ).first()
    if participant_entry:
        participant_entry.last_read_at=datetime.now(timezone.utc)
        db.session.commit()
    return jsonify([m.to_dict() for m in messages]), 200

@messaging_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    user, role = get_current_user()
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Message content cannot be empty'}), 400
    conv = Conversation.query.get_or_404(conversation_id)
    is_participant = any(p for p in user.conversations if p.id == conversation_id)
    if not is_participant:
        return jsonify({"error": "Forbidden"}), 403
    if role == 'superadmin':
        new_message = SuperAdminMessage(content=content, sender_id=user.id)
    else: # staff
        new_message = StaffMessage(content=content, sender_id=user.id)
    conv.messages.append(new_message)
    now = datetime.now(timezone.utc)
    notification_cooldown = timedelta(minutes=15)
    other_participants = ConversationParticipant.query.filter(
        ConversationParticipant.conversation_id == conversation_id,
        or_(
            ConversationParticipant.staff_id != (user.id if role == 'staff' else None),
            ConversationParticipant.super_admin_id != (user.id if role == 'superadmin' else None)
        )
    ).all()
    for p_assoc in other_participants:
        recipient = p_assoc.staff or p_assoc.super_admin
        if not recipient: continue
        if isinstance(recipient, Staff):
            db.session.add(Notification(staff_id=recipient.id, message=f"You have a new message from {user.name}.", target_type="Conversation", target_id=conversation_id, target_link="/admin/messaging"))
        should_send_realtime_notification = False
        if p_assoc.last_notified_at is None:
            should_send_realtime_notification = True
        else:
            last_notified_aware = p_assoc.last_notified_at.replace(tzinfo=timezone.utc)
            if (now - last_notified_aware) > notification_cooldown:
                should_send_realtime_notification = True
        if should_send_realtime_notification:
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            action_link = f"{frontend_url}/admin/messaging"
            email_data = {'message': f"You have a new message from {user.name} in one of your conversations.", 'action_link': action_link}
            send_email_in_background(subject="You have a new message", recipients=[recipient.email], template_data=email_data)
            push_payload = {"title": f"New Message from {user.name}", "body": new_message.content, "url": "/admin/messaging"}
            send_push_notification(recipient, push_payload)
            p_assoc.last_notified_at = now
    db.session.commit()
    return jsonify(new_message.to_dict()), 201