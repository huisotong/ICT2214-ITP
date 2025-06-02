from datetime import datetime
from app.db import db

class ChatHistory(db.Model):
    __tablename__ = 'ChatHistory'
    __table_args__ = {'schema': 'dbo'}
    
    historyID = db.Column(db.Integer, primary_key=True)
    assignmentID = db.Column(db.Integer, db.ForeignKey('dbo.ModuleAssignment.assignmentID'), nullable=False)
    chatlog = db.Column(db.Text) 
    dateStarted = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    assignment = db.relationship("ModuleAssignment", backref="chat_history")
