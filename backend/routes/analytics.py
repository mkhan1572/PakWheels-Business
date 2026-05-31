from flask import Blueprint, jsonify, request
from config import get_db

analytics_bp = Blueprint('analytics', __name__)

def fetchall_dict(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


# ── GET /api/analytics/overview ───────────────────────────
@analytics_bp.route('/overview', methods=['GET'])
def overview():
    """Key summary statistics for the dashboard."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                COUNT(*) AS total_listings,
                ROUND(AVG(price), 2) AS avg_price,
                ROUND(MIN(price), 2) AS min_price,
                ROUND(MAX(price), 2) AS max_price,
                ROUND(AVG(mileage_km), 0) AS avg_mileage,
                ROUND(AVG(engine_cc), 0) AS avg_engine_cc,
                COUNT(DISTINCT model) AS total_models,
                SUM(price) AS total_market_value,
                COUNT(DISTINCT city) AS distinct_cities
            FROM vehicles v
        """)
        row = cur.fetchone()
        stats = dict(zip([d[0] for d in cur.description], row))
        conn.close()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/trends ─────────────────────────────
@analytics_bp.route('/trends', methods=['GET'])
def trends():
    """Business trend insights panel analytics."""
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT transmission, COUNT(*), AVG(price)
            FROM vehicles
            GROUP BY transmission
        """)
        trans_rows = cur.fetchall()
        trans_data = {r[0]: {"count": r[1], "avg_price": float(r[2] or 0)} for r in trans_rows}

        premium_pct = 0
        if "Automatic" in trans_data and "Manual" in trans_data:
            auto_avg = trans_data["Automatic"]["avg_price"]
            manual_avg = trans_data["Manual"]["avg_price"]
            if manual_avg > 0:
                premium_pct = round(((auto_avg - manual_avg) / manual_avg) * 100, 1)

        cur.execute("""
            SELECT brand, COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vehicles) AS pct
            FROM vehicles
            GROUP BY brand
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """)
        make_row = cur.fetchone()
        make_dom = {"make": make_row[0], "percentage": round(float(make_row[1] or 0), 1)} if make_row else None

        cur.execute("""
            SELECT city, AVG(price) AS avg_p, COUNT(*)
            FROM vehicles
            WHERE city IS NOT NULL AND city != ''
            GROUP BY city
            HAVING COUNT(*) >= 5
            ORDER BY avg_p DESC
            LIMIT 1
        """)
        city_row = cur.fetchone()
        high_city = {"city": city_row[0], "avg_price": float(city_row[1] or 0)} if city_row else None

        conn.close()
        return jsonify({
            "transmission_split": trans_data,
            "auto_premium_pct": premium_pct,
            "dominant_make": make_dom,
            "high_pricing_city": high_city
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/makes ──────────────────────────────
@analytics_bp.route('/makes', methods=['GET'])
def makes_analytics():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT brand AS category, COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price,
                   ROUND(MIN(price), 2) AS min_price,
                   ROUND(MAX(price), 2) AS max_price
            FROM vehicles
            GROUP BY brand
            ORDER BY total_listings DESC
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/cities ─────────────────────────────
@analytics_bp.route('/cities', methods=['GET'])
def cities_analytics():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT city AS city_name, COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price
            FROM vehicles
            WHERE city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY total_listings DESC
            LIMIT 20
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/fuel-types ─────────────────────────
@analytics_bp.route('/fuel-types', methods=['GET'])
def fuel_analytics():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT fuel_type AS category, COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price
            FROM vehicles
            GROUP BY fuel_type
            ORDER BY total_listings DESC
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/body-types ─────────────────────────
@analytics_bp.route('/body-types', methods=['GET'])
def body_type_analytics():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT body_type AS category, COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price
            FROM vehicles
            GROUP BY body_type
            ORDER BY total_listings DESC
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/transmissions ──────────────────────
@analytics_bp.route('/transmissions', methods=['GET'])
def transmission_analytics():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT transmission AS category, COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price
            FROM vehicles
            GROUP BY transmission
            ORDER BY total_listings DESC
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/price-distribution ─────────────────
@analytics_bp.route('/price-distribution', methods=['GET'])
def price_distribution():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                CASE
                    WHEN price < 500000 THEN 'Below 500K'
                    WHEN price < 1000000 THEN '500K-1M'
                    WHEN price < 2000000 THEN '1M-2M'
                    WHEN price < 4000000 THEN '2M-4M'
                    ELSE '4M+' END AS range_label,
                COUNT(*) AS listings,
                ROUND(AVG(price), 2) AS avg_price
            FROM vehicles
            GROUP BY range_label
            ORDER BY MIN(price)
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/vehicle-age ────────────────────────
@analytics_bp.route('/vehicle-age', methods=['GET'])
def vehicle_age():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT year AS category,
                   COUNT(*) AS total_listings,
                   ROUND(AVG(price), 2) AS avg_price,
                   ROUND(AVG(mileage_km), 0) AS avg_mileage
            FROM vehicles
            WHERE year > 0
            GROUP BY year
            ORDER BY year DESC
            LIMIT 20
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/models ─────────────────────────────
@analytics_bp.route('/models', methods=['GET'])
def model_performance():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT model AS category,
                   COUNT(*) AS listings,
                   ROUND(AVG(price), 2) AS avg_price,
                   ROUND(AVG(mileage_km), 0) AS avg_mileage
            FROM vehicles
            GROUP BY model
            ORDER BY listings DESC
            LIMIT 50
        """)
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/analytics/top-makes?limit=5 ──────────────────
@analytics_bp.route('/top-makes', methods=['GET'])
def top_makes():
    limit = min(20, int(request.args.get('limit', 5)))
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT brand AS make_name, COUNT(*) AS count
            FROM vehicles
            GROUP BY brand
            ORDER BY count DESC
            LIMIT %s
        """, (limit,))
        data = fetchall_dict(cur)
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
