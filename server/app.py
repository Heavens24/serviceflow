from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from config import Config
from database import db
from models import (
    User,
    ServiceRequest,
    Review,
    Message,
    ArtisanProfile,
    Notification,
)

# ==========================
# Import Routes
# ==========================
from routes.auth import auth_bp
from routes.service_request import service_request_bp
from routes.review import review_bp
from routes.message import message_bp
from routes.artisan_profile import artisan_profile_bp
from routes.notification import notification_bp
from routes.dashboard import dashboard_bp

# ==========================
# Create Flask App
# ==========================
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)

# ==========================
# Initialize Extensions
# ==========================
db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# ==========================
# Register Blueprints
# ==========================
app.register_blueprint(auth_bp)
app.register_blueprint(service_request_bp)
app.register_blueprint(review_bp)
app.register_blueprint(message_bp)
app.register_blueprint(artisan_profile_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(dashboard_bp)

# ==========================
# Home Route
# ==========================
@app.route("/")
def home():
    return {
        "message": "Welcome to the ServiceFlow API",
        "status": "running",
    }


# ==========================
# Health Check
# ==========================
@app.route("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
    }


# ==========================
# Run Application
# ==========================
if __name__ == "__main__":
    app.run(debug=True)