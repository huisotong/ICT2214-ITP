
import json

def test_get_all_users(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/users' page is requested (GET)
    THEN check that the response is valid
    """
    response = test_client.get('/api/users')
    assert response.status_code == 200

def test_login(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/login' page is posted to (POST)
    THEN check that the response is valid
    """
    response = test_client.post('/api/login', 
                                data=json.dumps(dict(email='test@test.com', password='password')),
                                content_type='application/json')
    assert response.status_code == 401 # Unauthorized since the user does not exist
