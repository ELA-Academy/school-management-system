from flask import Blueprint, request, jsonify
from app.models import db
from app.models.task_model import Task
from app.models.lead_model import Lead
from app.models.department_model import Department
from app.models.staff_model import Staff
from app.models.super_admin_model import SuperAdmin # Import the SuperAdmin model
from app.models.activity_log_model import log_activity
from app.utils.notifications import create_notifications_and_send_emails
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt # Import get_jwt
from sqlalchemy import or_
from datetime import datetime

task_bp = Blueprint('tasks', __name__)

@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    # This route is specifically for staff, so it correctly only checks the Staff table. No change needed.
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


@task_bp.route('/lead/<string:lead_token>', methods=['GET'])
@jwt_required()
def get_tasks_for_lead(lead_token):
    # This route is generic and has no user-specific logic, so no change is needed.
    lead = Lead.query.filter_by(secure_token=lead_token).first_or_404()
    tasks = Task.query.filter_by(lead_id=lead.id).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200


@task_bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    # --- THIS IS THE FIX ---
    # Determine the actor based on their role from the JWT token
    claims = get_jwt()
    current_user_email = get_jwt_identity()
    actor = None
    
    if claims.get('role') == 'superadmin':
        actor = SuperAdmin.query.filter_by(email=current_user_email).first()
    elif claims.get('role') == 'staff':
        # SuperAdmins might not have a staff ID, so we need a check
        created_by_staff_id_field = 'created_by_staff_id'
        actor = Staff.query.filter_by(email=current_user_email).first()

    if not actor:
        # This now correctly returns a 401 Unauthorized instead of 404
        return jsonify({"error": "Unauthorized: Actor not found for this role."}), 401
    # --- END OF FIX ---

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

    # --- FIX: Handle task creator ID based on role ---
    # The 'created_by_staff_id' column requires a Staff ID. 
    # If a SuperAdmin creates a task, we can't fill this.
    # We will find a default staff member (e.g., the first one) to associate it with.
    # In a real-world app, you might have a dedicated "System" or "Admin" staff account.
    creator_staff_id = None
    if claims.get('role') == 'staff':
        creator_staff_id = actor.id
    else: # If SuperAdmin, find a fallback staff ID
        first_staff = Staff.query.first()
        if first_staff:
            creator_staff_id = first_staff.id
        else:
            return jsonify({"error": "Cannot create task. No staff members exist in the system to assign as creator."}), 400

    new_task = Task(
        title=data['title'],
        note=data.get('note', ''),
        lead_id=data['lead_id'],
        created_by_staff_id=creator_staff_id,
        due_date=due_date
    )
    # --- END OF FIX ---
    
    recipients = set()
    for dept_id in assigned_department_ids:
        dept = Department.query.get(dept_id)
        if dept:
            new_task.assigned_departments.append(dept)
            for member in dept.staff_members:
                recipients.add(member)

    for staff_id in assigned_staff_ids:
        staff = Staff.query.get(staff_id)
        if staff:
            new_task.assigned_staff.append(staff)
            recipients.add(staff)

    db.session.add(new_task)
    
    log_activity(actor, f"Created a new task: '{new_task.title}'", lead)
    
    student_name = f"{lead.students[0].first_name} {lead.students[0].last_name}"
    message = f"{actor.name} assigned you a new task: '{new_task.title}' for the lead {student_name}."
    
    final_recipients = [r for r in recipients] # Don't filter out the actor
    if final_recipients:
         create_notifications_and_send_emails(final_recipients, message, new_task)

    db.session.commit()

    return jsonify(new_task.to_dict()), 201


@task_bp.route('/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(id):
    # --- THIS IS THE FIX ---
    # Apply the same role-aware logic here
    claims = get_jwt()
    current_user_email = get_jwt_identity()
    actor = None

    if claims.get('role') == 'superadmin':
        actor = SuperAdmin.query.filter_by(email=current_user_email).first()
    elif claims.get('role') == 'staff':
        actor = Staff.query.filter_by(email=current_user_email).first()

    if not actor:
        return jsonify({"error": "Unauthorized: Actor not found for this role."}), 401
    # --- END OF FIX ---

    task = Task.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    task.status = new_status
    
    if new_status == 'Completed':
        log_activity(actor, f"Completed task: '{task.title}'", task.lead)

    db.session.commit()
    
    return jsonify(task.to_dict()), 200