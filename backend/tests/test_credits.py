
import json

def test_signup_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/signup' page is posted to (POST) with missing data
    THEN check that the response is a server error
    """
    response = test_client.post('/api/signup', 
                                data=json.dumps(dict(email='testuser@test.com')),
                                content_type='application/json')
    assert response.status_code == 500
