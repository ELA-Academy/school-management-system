from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """Initialize the SQLAlchemy database with the Flask app."""
    db.init_app(app)

    # Import models here to ensure they're registered before creating tables
    with app.app_context():
        from app.models.super_admin_model import SuperAdmin
        from app.models.department_model import Department
        from app.models.staff_model import Staff
        from app.models.lead_model import Lead, LeadStudent, LeadParent
        from app.models.task_model import Task
        from app.models.student_model import Student, Parent
        from app.models.activity_log_model import ActivityLog
        from app.models.notification_model import Notification
        from app.models.conversation_model import Conversation, Message, ConversationParticipant
        from app.models.push_subscription_model import PushSubscription
        from app.models.enrollment_form_model import EnrollmentForm
        from app.models.enrollment_submission_model import EnrollmentSubmission
        from app.models.financial_model import (
            StudentFinancialAccount, PresetChargeItem, Invoice, 
            InvoiceItem, Payment, Credit, BillingPlan, Subscription
        )
        from app.models.subsidy_model import Subsidy
        
        db.create_all()