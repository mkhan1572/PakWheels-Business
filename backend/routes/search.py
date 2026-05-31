from flask import Blueprint, jsonify, request
from config import get_db

search_bp = Blueprint('search', __name__)

def rows_to_list(cur, rows):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in rows]


def _search_base_query():
    return """
        SELECT
            v.vehicle_id AS listing_id,
            COALESCE(v.title, CONCAT(v.brand, ' ', v.model)) AS title,
            v.brand AS make,
            v.model AS model,
            v.year,
            v.price,
            COALESCE(v.price_currency, 'PKR') AS price_currency,
            v.fuel_type AS fuel,
            v.transmission,
            v.engine_cc,
            v.mileage_km,
            v.city,
            v.image_url
        FROM vehicles v
    """


# ── GET /api/search?q=corolla&city=Lahore&... ─────────────
@search_bp.route('', methods=['GET'])
def search():
    q = request.args.get('q', '').strip()
    city = request.args.get('city', '')
    fuel = request.args.get('fuel', '')
    year_min = request.args.get('year_min', '')
    year_max = request.args.get('year_max', '')
    price_max = request.args.get('price_max', '')

    where = []
    params = []

    if q:
        where.append("(v.brand LIKE %s OR v.model LIKE %s OR CONCAT(v.brand, ' ', v.model) LIKE %s)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    if city:
        where.append("v.city = %s")
        params.append(city)
    if fuel:
        where.append("v.fuel_type = %s")
        params.append(fuel)
    if year_min:
        where.append("v.year >= %s")
        params.append(int(year_min))
    if year_max:
        where.append("v.year <= %s")
        params.append(int(year_max))
    if price_max:
        where.append("v.price <= %s")
        params.append(float(price_max))

    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    sql = f"""
        { _search_base_query() }
        {where_sql}
        ORDER BY v.price DESC
        LIMIT 50
    """

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(sql, params)
        data = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify({"count": len(data), "results": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/search/similar/<listing_id> ──────────────────
@search_bp.route('/similar/<int:listing_id>', methods=['GET'])
def similar_cars(listing_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT brand, model, price FROM vehicles WHERE vehicle_id=%s", (listing_id,))
        ref = cur.fetchone()
        if not ref:
            conn.close()
            return jsonify({"error": "Listing not found"}), 404

        brand, model, ref_price = ref
        tolerance = float(ref_price) * 0.20

        cur.execute("""
            SELECT
                v.vehicle_id AS listing_id,
                COALESCE(v.title, CONCAT(v.brand, ' ', v.model)) AS title,
                v.brand AS make,
                v.model AS model,
                v.year,
                v.price,
                COALESCE(v.price_currency, 'PKR') AS price_currency,
                v.city,
                v.mileage_km,
                v.image_url,
                ABS(v.price - %s) AS price_diff
            FROM vehicles v
            WHERE v.brand = %s
              AND v.model = %s
              AND v.vehicle_id != %s
              AND ABS(v.price - %s) <= %s
            ORDER BY price_diff ASC
            LIMIT 10
        """, (ref_price, brand, model, listing_id, ref_price, tolerance))

        data = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
