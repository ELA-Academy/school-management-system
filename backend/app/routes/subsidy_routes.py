from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models import db
from app.models.subsidy_model import Subsidy

subsidy_bp = Blueprint('subsidy', __name__)

@subsidy_bp.route('/', methods=['GET'])
@jwt_required()
def get_subsidies():
    subsidies = Subsidy.query.order_by(Subsidy.name).all()
    return jsonify([s.to_dict() for s in subsidies]), 200

@subsidy_bp.route('/', methods=['POST'])
@jwt_required()
def create_subsidy():
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({"error": "Subsidy name is required."}), 400
    
    if Subsidy.query.filter_by(name=name).first():
        return jsonify({"error": "A subsidy with this name already exists."}), 409

    new_subsidy = Subsidy(name=name)
    db.session.add(new_subsidy)
    db.session.commit()
    return jsonify(new_subsidy.to_dict()), 201