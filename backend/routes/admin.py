from flask import Blueprint, jsonify, request

admin_bp = Blueprint('admin', __name__)

ADMIN_EMAIL = 'admin@pakwheels-db.com'
ADMIN_PASSWORD = 'Password123'


@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        return jsonify({
            "message": "Login successful",
            "admin": {
                "name": "Ali Hassan",
                "email": ADMIN_EMAIL,
                "role": "admin",
                "permissions": [
                    "Manage users",
                    "Manage listings",
                    "View reports",
                    "Manage settings"
                ]
            }
        })

    return jsonify({"error": "Invalid admin email or password"}), 401
