import unittest
from api import app

class TestAPIRoutes(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
    def test_session_creation(self):
        response = self.app.post('/api/session')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('sessionId', data)
        
    def test_progress_without_session(self):
        response = self.app.get('/api/progress')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)