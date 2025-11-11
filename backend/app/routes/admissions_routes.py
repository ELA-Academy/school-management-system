from flask import Blueprint, request, jsonify
from app.models import db
from app.models.lead_model import Lead, LeadStudent, LeadParent
from app.models.staff_model import Staff
from app.models.department_model import Department
from app.models.activity_log_model import log_activity
from app.utils.notifications import create_notifications_and_send_emails
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

admissions_bp = Blueprint('admissions', __name__)

@admissions_bp.route('/leads', methods=['POST'])
def create_lead():
    data = request.get_json()
    students_data = data.get('students', [])
    parents_data = data.get('parents', [])
    if not students_data or not parents_data:
        return jsonify({"error": "Student and parent information are required."}), 400
    if not data.get('policy_agreed'):
        return jsonify({"error": "Policy agreement is required."}), 400
        
    new_lead = Lead(policy_agreed=data.get('policy_agreed', False))
    db.session.add(new_lead)
    db.session.flush()

    for student_info in students_data:
        new_student = LeadStudent(
            first_name=student_info['first_name'],
            last_name=student_info['last_name'],
            date_of_birth=datetime.strptime(student_info['date_of_birth'], '%Y-%m-%d').date(),
            city_state=student_info['city_state'],
            grade_level=student_info['grade_level'],
            lead_id=new_lead.id
        )
        db.session.add(new_student)
    for parent_info in parents_data:
        new_parent = LeadParent(
            first_name=parent_info['first_name'],
            last_name=parent_info['last_name'],
            email=parent_info['email'],
            phone=parent_info['phone'],
            lead_id=new_lead.id
        )
        db.session.add(new_parent)

    log_activity(None, "Submitted a new admission application", new_lead)

    admissions_dept = Department.query.filter_by(name="Admission Department").first()
    if admissions_dept and admissions_dept.staff_members:
        student_name = f"{students_data[0]['first_name']} {students_data[0]['last_name']}"
        message = f"A new admission application has been submitted for {student_name}."
        create_notifications_and_send_emails(
            recipients=admissions_dept.staff_members,
            message=message,
            target_obj=new_lead
        )

    db.session.commit()
    # The to_dict() method on Lead will handle the new model names, no change needed here
    return jsonify(new_lead.to_dict()), 201

@admissions_bp.route('/leads', methods=['GET'])
@jwt_required()
def get_all_leads():
    leads = Lead.query.order_by(Lead.created_at.desc()).all()
    return jsonify([lead.to_dict() for lead in leads]), 200

@admissions_bp.route('/leads/<string:token>', methods=['GET'])
@jwt_required()
def get_lead_by_token(token):
    lead = Lead.query.filter_by(secure_token=token).first_or_404()
    return jsonify(lead.to_dict()), 200

@admissions_bp.route('/leads/<string:token>/details', methods=['PUT'])
@jwt_required()
def update_lead_details(token):
    current_user_email = get_jwt_identity()
    actor = Staff.query.filter_by(email=current_user_email).first()
    if not actor:
        return jsonify({"error": "Unauthorized actor"}), 401

    lead = Lead.query.filter_by(secure_token=token).first_or_404()
    data = request.get_json()

    students_data = data.get('students', [])
    for s_data in students_data:
        student = LeadStudent.query.get(s_data['id'])
        if student and student.lead_id == lead.id:
            student.first_name = s_data['first_name']
            student.last_name = s_data['last_name']
            dob_str = s_data['date_of_birth'].split('T')[0]
            student.date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
            student.city_state = s_data['city_state']
            student.grade_level = s_data['grade_level']

    parents_data = data.get('parents', [])
    for p_data in parents_data:
        parent = LeadParent.query.get(p_data['id'])
        if parent and parent.lead_id == lead.id:
            parent.first_name = p_data['first_name']
            parent.last_name = p_data['last_name']
            parent.email = p_data['email']
            parent.phone = p_data['phone']
    
    log_activity(actor, "Updated lead details (student/parent info)", lead)

    db.session.commit()
    return jsonify(lead.to_dict()), 200

@admissions_bp.route('/leads/<string:token>', methods=['PUT'])
@jwt_required()
def update_lead(token):
    current_user_email = get_jwt_identity()
    actor = Staff.query.filter_by(email=current_user_email).first()
    if not actor:
        return jsonify({"error": "Unauthorized actor"}), 401
        
    lead = Lead.query.filter_by(secure_token=token).first_or_404()
    data = request.get_json()

    log_message = "Updated lead"
    if 'status' in data:
        log_message += f" status to '{data['status']}'"
    if 'internal_notes' in data:
        log_message += " and updated internal notes"
        
    log_activity(actor, log_message, lead)

    if 'status' in data:
        lead.status = data['status']
    if 'internal_notes' in data:
        lead.internal_notes = data['internal_notes']
        
    db.session.commit()
    return jsonify(lead.to_dict()), 200