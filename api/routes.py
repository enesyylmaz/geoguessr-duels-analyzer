from flask import jsonify, request, send_from_directory, make_response
import os
import threading
from flask_cors import cross_origin
from . import app
from .services import process_geoguessr_data
from .session_manager import session_manager

@app.route("/api/<path:path>", methods=["OPTIONS"])
@cross_origin(supports_credentials=True)
def handle_options(path):
    response = app.make_default_options_response()
    return response

@app.route('/api/session', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_user_session():
    """Create a new session for a user"""
    session_id = session_manager.create_session()
    response = make_response(jsonify({"sessionId": session_id}))

    response.set_cookie('session_id', session_id, httponly=True, samesite='Lax', max_age=3600)
    
    return response

@app.route('/api/progress')
@cross_origin(supports_credentials=True)
def get_progress():
    """Get the progress of analysis for a session"""
    session_id = request.cookies.get('session_id')
    
    if not session_id:
        session_id = request.args.get('sessionId')
        
    if not session_id:
        return jsonify({"error": "No session ID provided"}), 400
        
    session = session_manager.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found or expired"}), 404
        
    return jsonify(session.progress)

@app.route('/api/analyze', methods=['POST'])
@cross_origin(supports_credentials=True)
def analyze():
    """Start analysis for a user session"""
    data = request.json
    auth_token = data.get('authToken')
    
    session_id = data.get('sessionId')
    if not session_id:
        session_id = request.cookies.get('session_id')
        if not session_id:
            session_id = session_manager.create_session()
    
    if not auth_token:
        return jsonify({"error": "Auth token is required"}), 400
    
    session = session_manager.get_session(session_id)
    if not session:
        session_id = session_manager.create_session()
        session = session_manager.get_session(session_id)
    
    thread = threading.Thread(
        target=process_geoguessr_data, 
        args=(session_id, auth_token)
    )
    
    session.analysis_thread = thread
    thread.start()
    
    response = make_response(jsonify({
        "message": "Analysis started",
        "sessionId": session_id
    }))
    
    response.set_cookie('session_id', session_id, httponly=True, samesite='Lax', max_age=3600)
    
    return response

@app.route('/api/results')
@cross_origin(supports_credentials=True)
def get_results():
    """Get analysis results for a session"""
    session_id = request.cookies.get('session_id')
    
    if not session_id:
        session_id = request.args.get('sessionId')
        
    if not session_id:
        return jsonify({"error": "No session ID provided"}), 400
        
    session = session_manager.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found or expired"}), 404
        
    if session.progress["status"] == "complete":
        return jsonify({
            "status": "complete",
            "data": session.analysis_results
        })
    else:
        return jsonify({
            "status": session.progress["status"],
            "message": session.progress["message"]
        })

@app.route('/api/session', methods=['DELETE'])
@cross_origin(supports_credentials=True)
def end_session():
    """End a user session and clean up resources"""
    session_id = request.cookies.get('session_id')
    if not session_id:
        session_id = request.args.get('sessionId')
        
    if not session_id:
        return jsonify({"error": "No session ID provided"}), 400
        
    success = session_manager.delete_session(session_id)
    if success:
        response = make_response(jsonify({"message": "Session ended successfully"}))
        response.delete_cookie('session_id')
        return response
    else:
        return jsonify({"error": "Session not found"}), 404
        
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    return send_from_directory(app.static_folder, "index.html")