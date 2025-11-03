from app.models import db
from datetime import datetime
import uuid

class Lead(db.Model):
    __tablename__ = 'leads'

    id = db.Column(db.Integer, primary_key=True)
    secure_token = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Lead Status
    status = db.Column(db.String(50), default='Waitlisted', nullable=False)
    payment_status = db.Column(db.String(50), default='Unpaid', nullable=True)
    expected_start_date = db.Column(db.Date, nullable=True)
    amount = db.Column(db.Float, nullable=True)

    # Policy & Consent
    policy_agreed = db.Column(db.Boolean, default=False, nullable=False)

    # Internal Notes
    internal_notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- NEW RELATIONSHIPS ---
    students = db.relationship('Student', backref='lead', lazy=True, cascade="all, delete-orphan")
    parents = db.relationship('Parent', backref='lead', lazy=True, cascade="all, delete-orphan")
    tasks = db.relationship('Task', backref='lead', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'secure_token': self.secure_token,
            'status': self.status,
            'payment_status': self.payment_status,
            'expected_start_date': self.expected_start_date.isoformat() if self.expected_start_date else None,
            'amount': self.amount,
            'policy_agreed': self.policy_agreed,
            'internal_notes': self.internal_notes,
            # --- FIX: Add 'Z' to specify UTC timezone ---
            'created_at': self.created_at.isoformat() + 'Z',
            'students': [student.to_dict() for student in self.students],
            'parents': [parent.to_dict() for parent in self.parents],
        }