from flask import Blueprint, request, jsonify
from app.models import db
from app.models.task_model import Task
from app.models.lead_model import Lead
from app.models.department_model import Department
from app.models.staff_model import Staff
from app.models.super_admin_model import SuperAdmin
from app.models.activity_log_model import log_activity
from app.utils.notifications import create_notifications_and_send_emails
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_
from datetime import datetime

task_bp = Blueprint('tasks', __name__)

def get_actor_from_jwt():
    claims = get_jwt()
    current_user_email = get_jwt_identity()
    if claims.get('role') == 'superadmin':
        return SuperAdmin.query.filter_by(email=current_user_email).first()
    elif claims.get('role') == 'staff':
        return Staff.query.filter_by(email=current_user_email).first()
    return None

@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    current_user_email = get_jwt_identity()
    staff_member = Staff.query.filter_by(email=current_user_email).first()

    if not staff_member:
        return jsonify({"error": "Staff member not found"}), 404

    staff_department_ids = [dept.id for dept in staff_member.departments]

    tasks = Task.query.filter(
        or_(
            Task.assigned_departments.any(Department.id.in_(staff_department_ids)),
            Task.assigned_staff.any(id=staff_member.id)
        )
    ).order_by(Task.created_at.desc()).all()

    return jsonify([task.to_dict() for task in tasks]), 200

@task_bp.route('/my-tasks/count', methods=['GET'])
@jwt_required()
def get_my_tasks_count():
    """Returns the count of active (not completed) tasks for a staff member."""
    current_user_email = get_jwt_identity()
    staff_member = Staff.query.filter_by(email=current_user_email).first()

    if not staff_member:
        return jsonify({"count": 0}), 200 # Return 0 if not a staff member

    staff_department_ids = [dept.id for dept in staff_member.departments]

    count = Task.query.filter(
        Task.status != 'Completed',
        or_(
            Task.assigned_departments.any(Department.id.in_(staff_department_ids)),
            Task.assigned_staff.any(id=staff_member.id)
        )
    ).count()

    return jsonify({"count": count}), 200

@task_bp.route('/lead/<string:lead_token>', methods=['GET'])
@jwt_required()
def get_tasks_for_lead(lead_token):
    lead = Lead.query.filter_by(secure_token=lead_token).first_or_404()
    tasks = Task.query.filter_by(lead_id=lead.id).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200


@task_bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    actor = get_actor_from_jwt()
    if not actor:
        return jsonify({"error": "Unauthorized: Actor not found for this role."}), 401

    data = request.get_json()
    required_fields = ['title', 'lead_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    assigned_department_ids = data.get('assigned_department_ids', [])
    assigned_staff_ids = data.get('assigned_staff_ids', [])

    if not assigned_department_ids and not assigned_staff_ids:
        return jsonify({"error": "Task must be assigned to at least one department or staff member."}), 400

    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid due_date format. Please use ISO 8601 format."}), 400

    lead = Lead.query.get(data['lead_id'])
    if not lead:
        return jsonify({"error": "Associated lead not found."}), 404

    creator_staff_id = actor.id if isinstance(actor, Staff) else Staff.query.first().id
    if not creator_staff_id:
        return jsonify({"error": "Cannot create task. No staff members exist in the system."}), 400

    new_task = Task(title=data['title'], note=data.get('note', ''), lead_id=data['lead_id'], created_by_staff_id=creator_staff_id, due_date=due_date)
    
    recipients = set()
    for dept_id in assigned_department_ids:
        dept = Department.query.get(dept_id)
        if dept:
            new_task.assigned_departments.append(dept)
            recipients.update(dept.staff_members)

    for staff_id in assigned_staff_ids:
        staff = Staff.query.get(staff_id)
        if staff:
            new_task.assigned_staff.append(staff)
            recipients.add(staff)

    db.session.add(new_task)
    log_activity(actor, f"Created a new task: '{new_task.title}'", lead)
    
    student_name = f"{lead.students[0].first_name} {lead.students[0].last_name}"
    message = f"{actor.name} assigned you a new task: '{new_task.title}' for the lead {student_name}."
    
    if recipients:
         create_notifications_and_send_emails(list(recipients), message, new_task)

    db.session.commit()
    return jsonify(new_task.to_dict()), 201


@task_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_task(id):
    actor = get_actor_from_jwt()
    if not actor:
        return jsonify({"error": "Unauthorized: Actor not found for this role."}), 401

    task = Task.query.get_or_404(id)
    data = request.get_json()

    task.title = data.get('title', task.title)
    task.note = data.get('note', task.note)
    
    if data.get('due_date'):
        task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
    else:
        task.due_date = None

    if 'status' in data:
        task.status = data['status']
        if data['status'] == 'Completed':
            log_activity(actor, f"Completed task: '{task.title}'", task.lead)
        else:
            log_activity(actor, f"Updated task '{task.title}' status to '{data['status']}'", task.lead)
            
    if 'lead_status' in data:
        task.lead.status = data['lead_status']
        log_activity(actor, f"Updated lead status to '{data['lead_status']}' via task '{task.title}'", task.lead)

    if 'assigned_department_ids' in data or 'assigned_staff_ids' in data:
        task.assigned_departments.clear()
        task.assigned_staff.clear()
        new_recipients = set()
        for dept_id in data.get('assigned_department_ids', []):
            dept = Department.query.get(dept_id)
            if dept:
                task.assigned_departments.append(dept)
                new_recipients.update(dept.staff_members)
        for staff_id in data.get('assigned_staff_ids', []):
            staff = Staff.query.get(staff_id)
            if staff:
                task.assigned_staff.append(staff)
                new_recipients.add(staff)
        student_name = f"{task.lead.students[0].first_name} {task.lead.students[0].last_name}"
        message = f"{actor.name} assigned you a task: '{task.title}' for the lead {student_name}."
        if new_recipients:
            create_notifications_and_send_emails(list(new_recipients), message, task)
    
    db.session.commit()
    return jsonify(task.to_dict()), 200


@task_bp.route('/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(id):
    actor = get_actor_from_jwt()
    if not actor:
        return jsonify({"error": "Unauthorized: Actor not found for this role."}), 401

    task = Task.query.get_or_404(id)
    new_status = request.json.get('status')
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    task.status = new_status
    if new_status == 'Completed':
        log_activity(actor, f"Completed task: '{task.title}'", task.lead)

    db.session.commit()
    return jsonify(task.to_dict()), 200