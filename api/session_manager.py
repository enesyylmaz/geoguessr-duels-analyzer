import uuid
import threading
import time
from typing import Dict, Any, Optional

class UserSession:
    def __init__(self, user_id: str = None):
        self.session_id = str(uuid.uuid4())
        self.user_id = user_id
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.progress = {
            "current": 0,
            "total": 0,
            "status": "idle",
            "message": ""
        }
        self.analysis_results = None
        self.analysis_thread: Optional[threading.Thread] = None

class SessionManager:
    def __init__(self, session_expiry: int = 3600):
        self.sessions: Dict[str, UserSession] = {}
        self.session_expiry = session_expiry
        self.lock = threading.Lock()
        
        self.cleanup_thread = threading.Thread(target=self._cleanup_expired_sessions, daemon=True)
        self.cleanup_thread.start()
    
    def create_session(self, user_id: str = None) -> str:
        with self.lock:
            session = UserSession(user_id)
            self.sessions[session.session_id] = session
            return session.session_id
    
    def get_session(self, session_id: str) -> Optional[UserSession]:
        with self.lock:
            session = self.sessions.get(session_id)
            if session:
                session.last_accessed = time.time()
            return session
    
    def update_session(self, session_id: str, progress=None, results=None, user_id=None) -> bool:
        with self.lock:
            session = self.sessions.get(session_id)
            if not session:
                return False
                
            if progress:
                session.progress = progress
            
            if results is not None:
                session.analysis_results = results
                
            if user_id is not None:
                session.user_id = user_id
                
            session.last_accessed = time.time()
            return True
    
    def delete_session(self, session_id: str) -> bool:
        with self.lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
                return True
            return False
    
    def _cleanup_expired_sessions(self):
        while True:
            time.sleep(60)
            current_time = time.time()
            with self.lock:
                expired_sessions = [
                    session_id for session_id, session in self.sessions.items()
                    if current_time - session.last_accessed > self.session_expiry
                ]
                
                for session_id in expired_sessions:
                    del self.sessions[session_id]
                    
                    
session_manager = SessionManager()