from app.db import db
from app.models.module_assignment import ModuleAssignment # Import ModuleAssignment

class CreditRequest(db.Model):
    __tablename__ = 'CreditRequests'
    __table_args__ = {'schema': 'dbo'}

    requestID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignmentID = db.Column(db.Integer, db.ForeignKey('dbo.ModuleAssignment.assignmentID'), nullable=False)
    creditsRequested = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    requestDate = db.Column(db.DateTime, nullable=False)

    # Define the relationship to ModuleAssignment
    module_assignment = db.relationship('ModuleAssignment', backref=db.backref('credit_requests', lazy=True))

    def to_dict(self):
        data = {
            "requestID": self.requestID,
            "assignmentID": self.assignmentID,
            "creditsRequested": self.creditsRequested,
            "status": self.status,
            "requestDate": self.requestDate.isoformat() if self.requestDate else None,
            "studentID": None, # Will be populated by the route query
            "studentName": None # Will be populated by the route query
        }
        if self.module_assignment and self.module_assignment.user:
            data["studentID"] = self.module_assignment.user.studentID
            data["studentName"] = self.module_assignment.user.name
        return data
