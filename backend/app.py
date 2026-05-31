import os
from pathlib import Path
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

from routes.listings  import listings_bp
from routes.analytics import analytics_bp
from routes.filters   import filters_bp
from routes.search    import search_bp
from routes.admin     import admin_bp

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
app = Flask(
    __name__,
    static_folder=str(ROOT / 'frontend' / 'static'),
    template_folder=str(ROOT / 'frontend' / 'templates')
)
CORS(app)  # Allow requests from the frontend

# ── Register blueprints ───────────────────────────────────
app.register_blueprint(listings_bp,  url_prefix='/api/listings')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(filters_bp,   url_prefix='/api/filters')
app.register_blueprint(search_bp,    url_prefix='/api/search')
app.register_blueprint(admin_bp,     url_prefix='/api/admin')

# ── Frontend pages ─────────────────────────────────────────
@app.route('/', methods=['GET'])
def dashboard_page():
    return render_template('dashboard.html', page='dashboard')

@app.route('/listings', methods=['GET'])
def listings_page():
    return render_template('listings.html', page='listings')

@app.route('/listing/<int:listing_id>', methods=['GET'])
def listing_detail_page(listing_id):
    return render_template('listing_detail.html', page='detail', listing_id=listing_id)

@app.route('/admin', methods=['GET'])
def admin_page():
    return render_template('admin.html', page='admin')

@app.route('/compare', methods=['GET'])
def compare_page():
    return render_template('compare.html', page='compare')

# ── Health check ──────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "PakWheels API is running"})

# ── 404 handler ───────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

# ── 500 handler ───────────────────────────────────────────
@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug, port=5000)
