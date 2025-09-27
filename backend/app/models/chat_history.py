from datetime import datetime
from app.db import db

class ChatHistory(db.Model):
    __tablename__ = 'ChatHistory'
    __table_args__ = {'schema': 'dbo'}
    
    historyID = db.Column(db.Integer, primary_key=True)
    assignmentID = db.Column(db.Integer, db.ForeignKey('dbo.ModuleAssignment.assignmentID'), nullable=True)
    agentID = db.Column(db.String(50), db.ForeignKey('dbo.Agent.agentID'), nullable=True)
    chatlog = db.Column(db.Text) 
    dateStarted = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    assignment = db.relationship("ModuleAssignment", backref="chat_history")
    agent = db.relationship("Agent", backref="chat_history")
