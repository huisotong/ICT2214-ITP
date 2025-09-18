
import json

def test_get_credit_requests(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/credit-requests' page is requested (GET)
    THEN check that the response is valid
    """
    response = test_client.get('/api/credit-requests')
    assert response.status_code == 200

def test_update_credit_request_status_invalid_status(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/credit-requests/1/status' page is patched (PATCH) with an invalid status
    THEN check that the response is a 400 error
    """
    response = test_client.patch('/api/credit-requests/1/status', 
                                 data=json.dumps(dict(status='InvalidStatus')),
                                 content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Invalid status'

def test_submit_credit_request_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/credit-requests' page is posted to (POST) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/credit-requests', 
                                data=json.dumps({}),
                                content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Assignment ID and credits requested are required'

def test_delete_credit_request_not_found(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/credit-requests/999' page is requested (DELETE) for a non-existent request
    THEN check that the response is a 404 error
    """
    response = test_client.delete('/api/credit-requests/999')
    assert response.status_code == 404
    assert response.json['error'] == 'Credit request not found'
