
import json

def test_get_model_settings_not_found(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/get-model-settings/nonexistent' page is requested (GET)
    THEN check that the response is a 404 error
    """
    response = test_client.get('/api/get-model-settings/nonexistent')
    assert response.status_code == 404
    assert response.json['error'] == 'Settings not found'

def test_save_model_settings_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/save-model-settings' page is requested (PUT) with missing data
    THEN check that the response is a 500 error
    """
    response = test_client.put('/api/save-model-settings', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 500

def test_tag_document_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/tag-document' page is posted to (POST) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/tag-document', data={})
    assert response.status_code == 400
    assert response.json['error'] == 'Missing moduleID or file'

def test_untag_document_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/untag-document' page is posted to (POST) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/untag-document', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Missing moduleID or filename'

def test_send_message_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/send-message' page is posted to (POST) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/send-message', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'module_id, message, and user_id are required'

def test_get_chat_history_for_user_module_not_found(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/get-chat-history/nonexistent/nonexistent' page is requested (GET)
    THEN check that the response is a 404 error
    """
    response = test_client.get('/api/get-chat-history/1/nonexistent')
    assert response.status_code == 404
    assert response.json['error'] == 'No assignment found for the given user and module'

def test_get_module_model_not_found(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/get-module-model/nonexistent' page is requested (GET)
    THEN check that the response is a 404 error
    """
    response = test_client.get('/api/get-module-model/nonexistent')
    assert response.status_code == 404
    assert response.json['error'] == 'Chatbot settings not found for this module'
