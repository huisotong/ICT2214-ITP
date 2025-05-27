
from app.db import db

class ModuleAssignment(db.Model):
    __tablename__ = 'ModuleAssignment'
    __table_args__ = {'schema': 'dbo'}
    
    assignmentID = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    userID = db.Column(db.Integer, nullable=False)
    moduleID = db.Column(db.String(50), nullable=False)
    studentCredits = db.Column(db.Integer, nullable=True)