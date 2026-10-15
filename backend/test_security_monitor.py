"""Repeated failed-login signals are visible only to authenticated admins."""
import unittest
import test_integration as baseline
from fastapi.testclient import TestClient
from main import app

class SecurityMonitor(unittest.TestCase):
    def setUp(self): baseline.IntegrationTests.setUp(self)
    def tearDown(self): baseline.IntegrationTests.tearDown(self)

    def test_grouped_attempts_and_rate_limit_warning(self):
        with TestClient(app) as anonymous:
            self.assertEqual(anonymous.get('/api/security/login-activity').status_code,401)
        bad={'username':'test-admin','password':'incorrect-password'}
        for _ in range(3):
            self.assertEqual(self.client.post('/api/auth/login',json=bad).status_code,401)
        result=self.client.get('/api/security/login-activity')
        self.assertEqual(result.status_code,200,result.text)
        events=result.json()['events']
        self.assertEqual(len(events),1)
        self.assertEqual(events[0]['attempts'],3)
        self.assertEqual(events[0]['level'],'REVIEW')
        self.assertNotIn('127.0.0.1',str(events))
        for _ in range(7):
            self.assertEqual(self.client.post('/api/auth/login',json=bad).status_code,401)
        self.assertEqual(self.client.post('/api/auth/login',json=bad).status_code,429)
        event=self.client.get('/api/security/login-activity').json()['events'][0]
        self.assertEqual(event['attempts'],10)
        self.assertTrue(event['rate_limited'])
        self.assertEqual(event['level'],'HIGH')

if __name__=='__main__': unittest.main()
