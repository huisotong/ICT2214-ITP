
import json

def test_enroll_single_student_missing_data(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/enroll-student' page is posted to (POST) with missing data
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/enroll-student', 
                                data=json.dumps({}),
                                content_type='application/json')
    assert response.status_code == 400
    assert response.json['error'] == 'Missing studentID or moduleID'

def test_enroll_students_csv_no_file(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/enroll-students-csv' page is posted to (POST) without a file
    THEN check that the response is a 400 error
    """
    response = test_client.post('/api/enroll-students-csv')
    assert response.status_code == 400
    assert response.json['error'] == 'No CSV file uploaded'

def test_delete_assignment_not_found(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/delete-assignment/999' page is requested (DELETE) for a non-existent assignment
    THEN check that the response is a 404 error
    """
    response = test_client.delete('/api/delete-assignment/999')
    assert response.status_code == 404
    assert response.json['error'] == 'Assignment not found'

def test_search_students_empty_query(test_client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/api/search-students' page is requested (GET) with an empty query
    THEN check that the response is an empty list
    """
    response = test_client.get('/api/search-students')
    assert response.status_code == 200
    assert response.json == []
