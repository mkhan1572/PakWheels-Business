from flask import Blueprint, jsonify, request
from config import get_db

filters_bp = Blueprint('filters', __name__)

def flat_list(cur):
    return [r[0] for r in cur.fetchall()]

# ── GET /api/filters/makes ────────────────────────────────
@filters_bp.route('/makes', methods=['GET'])
def get_makes():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT brand FROM vehicles WHERE brand != '' ORDER BY brand")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/models?make=Toyota ───────────────────
@filters_bp.route('/models', methods=['GET'])
def get_models():
    make = request.args.get('make', '')
    try:
        conn = get_db()
        cur = conn.cursor()
        if make:
            cur.execute("SELECT DISTINCT model FROM vehicles WHERE brand=%s AND model != '' ORDER BY model", (make,))
        else:
            cur.execute("SELECT DISTINCT model FROM vehicles WHERE model != '' ORDER BY model")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/cities ───────────────────────────────
@filters_bp.route('/cities', methods=['GET'])
def get_cities():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT city FROM vehicles WHERE city != '' ORDER BY city")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/fuel-types ───────────────────────────
@filters_bp.route('/fuel-types', methods=['GET'])
def get_fuels():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT fuel_type FROM vehicles WHERE fuel_type != '' ORDER BY fuel_type")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/transmissions ───────────────────────
@filters_bp.route('/transmissions', methods=['GET'])
def get_transmissions():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT transmission FROM vehicles WHERE transmission != '' ORDER BY transmission")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/body-types ──────────────────────────
@filters_bp.route('/body-types', methods=['GET'])
def get_body_types():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT body_type FROM vehicles WHERE body_type != '' ORDER BY body_type")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── GET /api/filters/colors ─────────────────────────────
@filters_bp.route('/colors', methods=['GET'])
def get_colors():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT color FROM vehicles WHERE color != '' ORDER BY color")
        data = flat_list(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
