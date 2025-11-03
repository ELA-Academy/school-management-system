from app.models import db

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    city_state = db.Column(db.String(150), nullable=True)
    grade_level = db.Column(db.String(50), nullable=False)
    
    # Foreign Key to link to the main application/lead
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.isoformat(),
            'city_state': self.city_state,
            'grade_level': self.grade_level,
        }