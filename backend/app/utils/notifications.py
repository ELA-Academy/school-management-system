from flask import current_app, render_template
from flask_mail import Message
from threading import Thread
from app.models import db
from app.models.notification_model import Notification
from app.models.department_model import Department
from app.models.staff_model import Staff

# --- Background Email Sending ---
def send_async_email(app, msg):
    with app.app_context():
        from app import mail
        try:
            mail.send(msg)
        except Exception as e:
            app.logger.error(f"Failed to send email: {e}")

def send_email_in_background(subject, recipients, template_data):
    app = current_app._get_current_object()
    html_body = render_template('email/notification.html', **template_data)
    msg = Message(subject, recipients=recipients, html=html_body)
    thr = Thread(target=send_async_email, args=[app, msg])
    thr.start()
    return thr

# --- Central Notification Creation Logic ---
def create_notifications_and_send_emails(recipients, message, target_obj=None):
    """
    Creates database notifications and sends emails to a list of staff recipients.
    
    :param recipients: A list of Staff objects to notify.
    :param message: The notification message string.
    :param target_obj: The database object the notification is about (e.g., a Lead or Task).
    """
    if not recipients:
        return

    # Determine the link for the notification
    target_link = None
    if target_obj:
        if target_obj.__class__.__name__ == 'Lead':
            target_link = f"/admin/admissions/leads/{target_obj.secure_token}"
        elif target_obj.__class__.__name__ == 'Task' and hasattr(target_obj, 'lead'):
             target_link = f"/admin/admissions/leads/{target_obj.lead.secure_token}"

    # Create DB notifications for each recipient
    for staff in recipients:
        new_notification = Notification(
            staff_id=staff.id,
            message=message,
            target_type=target_obj.__class__.__name__ if target_obj else None,
            target_id=target_obj.id if target_obj else None,
            target_link=target_link
        )
        db.session.add(new_notification)

    # Prepare and send one email to all recipients
    recipient_emails = [staff.email for staff in recipients]
    email_data = {
        'message': message,
        'action_link': f"http://localhost:5173{target_link}" if target_link else None
    }
    send_email_in_background(
        subject="You have a new notification",
        recipients=recipient_emails,
        template_data=email_data
    )