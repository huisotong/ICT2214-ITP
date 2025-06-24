from app.db import db
from app.models.users import User # Import User model

class ModuleAssignment(db.Model):
    __tablename__ = 'ModuleAssignment'
    __table_args__ = {'schema': 'dbo'}
    
    assignmentID = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    # Assuming userID is a foreign key to User.userID
    userID = db.Column(db.Integer, db.ForeignKey('dbo.Users.userID'), nullable=False)
    moduleID = db.Column(db.String(50), nullable=False)
    studentCredits = db.Column(db.Float, nullable=True)

    # Define the relationship to User
    user = db.relationship('User', backref=db.backref('module_assignments', lazy=True))