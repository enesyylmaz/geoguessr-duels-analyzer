from flask import jsonify, request, send_from_directory
import os
import threading
from flask_cors import cross_origin
from . import app
from .services import process_geoguessr_data
from .constants import app_state
    
@app.route("/api/<path:path>", methods=["OPTIONS"])
@cross_origin(supports_credentials=True)
def handle_options(path):
    response = app.make_default_options_response()
    return response

@app.route('/api/progress')
@cross_origin(supports_credentials=True)
def get_progress():
    return jsonify(app_state.progress)

@app.route('/api/analyze', methods=['POST'])
@cross_origin(supports_credentials=True)
def analyze():
    data = request.json
    auth_token = data.get('authToken')
    
    if not auth_token:
        return jsonify({"error": "Auth token is required"}), 400
    
    thread = threading.Thread(target=process_geoguessr_data, args=(auth_token,))
    thread.start()
    
    return jsonify({"message": "Analysis started"})

@app.route('/api/results')
@cross_origin(supports_credentials=True)
def get_results():
    if app_state.progress["status"] == "complete":
        return jsonify({
            "status": "complete",
            "data": app_state.analysis_results
        })
    else:
        return jsonify({
            "status": app_state.progress["status"],
            "message": app_state.progress["message"]
        })
        
        
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    return send_from_directory(app.static_folder, "index.html")