from flask import Blueprint, jsonify, request
from config import get_db

listings_bp = Blueprint('listings', __name__)


def rows_to_list(cur, rows):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in rows]


def row_to_dict(cur, row):
    cols = [d[0] for d in cur.description]
    return dict(zip(cols, row))


def _vehicle_base_select():
    return """
        SELECT
            v.vehicle_id AS listing_id,
            COALESCE(v.title, CONCAT(v.brand, ' ', v.model)) AS title,
            v.brand AS make,
            v.model AS model,
            v.year,
            v.body_type,
            v.color,
            v.fuel_type AS fuel,
            v.transmission,
            v.engine_cc,
            v.mileage_km,
            v.price,
            COALESCE(v.price_currency, 'PKR') AS price_currency,
            v.price_note,
            v.city,
            v.image_url,
            v.detail_url,
            v.scraped_at
        FROM vehicles v
    """


# ── GET /api/listings  (with optional filters + pagination) ─────────────────
@listings_bp.route('', methods=['GET'])
def get_listings():
    p = request.args
    page = max(1, int(p.get('page', 1)))
    limit = min(100, max(1, int(p.get('limit', 20))))
    offset = (page - 1) * limit

    where = []
    params = []

    if p.get('make'):
        where.append("v.brand = %s")
        params.append(p['make'])
    if p.get('model'):
        where.append("v.model = %s")
        params.append(p['model'])
    if p.get('city'):
        where.append("v.city = %s")
        params.append(p['city'])
    if p.get('fuel'):
        where.append("v.fuel_type = %s")
        params.append(p['fuel'])
    if p.get('transmission'):
        where.append("v.transmission = %s")
        params.append(p['transmission'])
    if p.get('body_type'):
        where.append("v.body_type = %s")
        params.append(p['body_type'])
    if p.get('year_min'):
        where.append("v.year >= %s")
        params.append(int(p['year_min']))
    if p.get('year_max'):
        where.append("v.year <= %s")
        params.append(int(p['year_max']))
    if p.get('price_min'):
        where.append("v.price >= %s")
        params.append(float(p['price_min']))
    if p.get('price_max'):
        where.append("v.price <= %s")
        params.append(float(p['price_max']))
    if p.get('engine_min'):
        where.append("v.engine_cc >= %s")
        params.append(int(p['engine_min']))
    if p.get('engine_max'):
        where.append("v.engine_cc <= %s")
        params.append(int(p['engine_max']))
    if p.get('mileage_max'):
        where.append("v.mileage_km <= %s")
        params.append(int(p['mileage_max']))
    if p.get('search'):
        where.append("(v.brand LIKE %s OR v.model LIKE %s OR v.title LIKE %s)")
        params += [f"%{p['search']}%"] * 3

    where_sql = "WHERE " + " AND ".join(where) if where else ""
    sort_map = {
        'price_desc': 'v.price DESC',
        'price_asc': 'v.price ASC',
        'year_desc': 'v.year DESC',
        'year_asc': 'v.year ASC',
        'mileage_asc': 'v.mileage_km ASC',
        'mileage_desc': 'v.mileage_km DESC',
        'recent': 'v.vehicle_id DESC'
    }
    order_by = sort_map.get(p.get('sort', 'recent'), 'v.vehicle_id DESC')

    base_query = f"""
        { _vehicle_base_select() }
        {where_sql}
        ORDER BY {order_by}
    """

    count_query = f"SELECT COUNT(*) FROM vehicles v {where_sql}"

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(count_query, params)
        total = cur.fetchone()[0]
        cur.execute(base_query + " LIMIT %s OFFSET %s", params + [limit, offset])
        items = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "data": items
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/listings/<id> ──────────────────────────────────
@listings_bp.route('/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        query = f"""
            { _vehicle_base_select() }
            WHERE v.vehicle_id = %s
        """
        cur.execute(query, (listing_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Listing not found"}), 404
        return jsonify(row_to_dict(cur, row))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── POST /api/listings (Create Listing) ────────────────────────
@listings_bp.route('', methods=['POST'])
def create_listing():
    try:
        data = request.get_json() or {}
        errors = []

        for field in ['make', 'model', 'city']:
            if not data.get(field):
                errors.append(f"Field '{field}' is required.")

        try:
            price = float(data.get('price', 0))
            if price <= 0:
                errors.append("Price must be greater than zero.")
        except (ValueError, TypeError):
            errors.append("Price must be a valid number.")

        try:
            year = int(data.get('year', 0))
            if year < 1980 or year > 2026:
                errors.append("Year must be between 1980 and 2026.")
        except (ValueError, TypeError):
            errors.append("Year must be an integer.")

        mileage_km = 0
        if 'mileage_km' in data and data['mileage_km'] != '':
            try:
                mileage_km = int(data['mileage_km'])
                if mileage_km < 0:
                    errors.append("Mileage cannot be negative.")
            except (ValueError, TypeError):
                errors.append("Mileage must be an integer.")

        engine_cc = None
        if 'engine_cc' in data and data['engine_cc'] != '':
            try:
                engine_cc = int(data['engine_cc'])
                if engine_cc <= 0:
                    errors.append("Engine CC must be greater than zero.")
            except (ValueError, TypeError):
                errors.append("Engine CC must be an integer.")

        if errors:
            return jsonify({"errors": errors}), 400

        conn = get_db()
        cur = conn.cursor()

        title = data.get('title') or f"{data['make'].strip()} {data['model'].strip()}"
        image_url = data.get('image_url', '')
        detail_url = data.get('detail_url', '')
        price_currency = data.get('price_currency', 'PKR')
        price_note = data.get('price_note', '')
        scraped_at = data.get('scraped_at', None)

        cur.execute(
            """
            INSERT INTO vehicles (
                title, brand, model, year, body_type, color,
                fuel_type, transmission, engine_cc, mileage_km,
                price, price_currency, price_note, city,
                image_url, detail_url, scraped_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                title,
                data['make'].strip(),
                data['model'].strip(),
                year,
                data.get('body_type', ''),
                data.get('color', ''),
                data.get('fuel', ''),
                data.get('transmission', ''),
                engine_cc,
                mileage_km,
                price,
                price_currency,
                price_note,
                data.get('city', ''),
                image_url,
                detail_url,
                scraped_at
            )
        )
        vehicle_id = cur.lastrowid

        conn.commit()
        conn.close()

        return jsonify({"message": "Listing created successfully", "listing_id": vehicle_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── PUT /api/listings/<id> (Update Listing) ───────────────────
@listings_bp.route('/<int:listing_id>', methods=['PUT'])
def update_listing(listing_id):
    try:
        data = request.get_json() or {}
        errors = []

        for field in ['make', 'model', 'city']:
            if not data.get(field):
                errors.append(f"Field '{field}' is required.")

        try:
            price = float(data.get('price', 0))
            if price <= 0:
                errors.append("Price must be greater than zero.")
        except (ValueError, TypeError):
            errors.append("Price must be a valid number.")

        try:
            year = int(data.get('year', 0))
            if year < 1980 or year > 2026:
                errors.append("Year must be between 1980 and 2026.")
        except (ValueError, TypeError):
            errors.append("Year must be an integer.")

        mileage_km = 0
        if 'mileage_km' in data and data['mileage_km'] != '':
            try:
                mileage_km = int(data['mileage_km'])
                if mileage_km < 0:
                    errors.append("Mileage cannot be negative.")
            except (ValueError, TypeError):
                errors.append("Mileage must be an integer.")

        engine_cc = None
        if 'engine_cc' in data and data['engine_cc'] != '':
            try:
                engine_cc = int(data['engine_cc'])
                if engine_cc <= 0:
                    errors.append("Engine CC must be greater than zero.")
            except (ValueError, TypeError):
                errors.append("Engine CC must be an integer.")

        if errors:
            return jsonify({"errors": errors}), 400

        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM vehicles WHERE vehicle_id = %s", (listing_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": "Listing not found"}), 404

        title = data.get('title') or f"{data['make'].strip()} {data['model'].strip()}"
        image_url = data.get('image_url', '')
        detail_url = data.get('detail_url', '')
        price_currency = data.get('price_currency', 'PKR')
        price_note = data.get('price_note', '')
        scraped_at = data.get('scraped_at', None)

        cur.execute(
            """
            UPDATE vehicles SET
                title = %s,
                brand = %s,
                model = %s,
                year = %s,
                body_type = %s,
                color = %s,
                fuel_type = %s,
                transmission = %s,
                engine_cc = %s,
                mileage_km = %s,
                price = %s,
                price_currency = %s,
                price_note = %s,
                city = %s,
                image_url = %s,
                detail_url = %s,
                scraped_at = %s
            WHERE vehicle_id = %s
            """,
            (
                title,
                data['make'].strip(),
                data['model'].strip(),
                year,
                data.get('body_type', ''),
                data.get('color', ''),
                data.get('fuel', ''),
                data.get('transmission', ''),
                engine_cc,
                mileage_km,
                price,
                price_currency,
                price_note,
                data.get('city', ''),
                image_url,
                detail_url,
                scraped_at,
                listing_id
            )
        )

        conn.commit()
        conn.close()
        return jsonify({"message": "Listing updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── DELETE /api/listings/<id> (Delete Listing) ───────────────────
@listings_bp.route('/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM vehicles WHERE vehicle_id = %s", (listing_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": "Listing not found"}), 404

        cur.execute("DELETE FROM vehicles WHERE vehicle_id = %s", (listing_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Listing deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


