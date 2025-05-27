from app.db import db

class CreditRequest(db.Model):
    __tablename__ = 'CreditRequests'
    __table_args__ = {'schema': 'dbo'}

    requestID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignmentID = db.Column(db.Integer, nullable=False)
    creditsRequested = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    requestDate = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            "requestID": self.requestID,
            "assignmentID": self.assignmentID,
            "creditsRequested": self.creditsRequested,
            "status": self.status,
            "requestDate": self.requestDate.isoformat() if self.requestDate else None
        }
