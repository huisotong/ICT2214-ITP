
import json

def test_get_assigned_modules_no_user_id(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/get-assigned-modules' page is requested (GET) without a userId
    THEN check that the response is a 400 error
    """
    response = test_client.get('/api/get-assigned-modules')
    assert response.status_code == 400
    assert response.json['error'] == 'User ID is required'

def test_add_module_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/add-module' page is posted to (POST) with missing data
    THEN check that the response is a 500 error
    """
    response = test_client.post('/api/add-module', data={})
    assert response.status_code == 500

def test_delete_module_no_module_id(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/delete-module' page is requested (DELETE) without a moduleID
    THEN check that the response is a 400 error
    """
    response = test_client.delete('/api/delete-module', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Module ID is required'

def test_edit_module_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/edit-module' page is requested (PUT) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.put('/api/edit-module', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Missing required fields'
