from app.db import db
from datetime import datetime

class Agent(db.Model):
    __tablename__ = 'Agent'
    __table_args__ = {'schema': 'dbo'}
    
    agentID = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    system_prompt = db.Column(db.Text, nullable=False)
    model = db.Column(db.String(100), nullable=False)
    temperature = db.Column(db.Float, nullable=False, default=0.7)
    max_tokens = db.Column(db.Integer, nullable=False, default=1000)
    created_by = db.Column(db.Integer, db.ForeignKey('dbo.Users.userID'), nullable=False)
    is_public = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    share_token = db.Column(db.String(100), nullable=False, unique=True)
    view_count = db.Column(db.Integer, nullable=False, default=0)
    
    # Relationship with User
    creator = db.relationship('User', backref='created_agents')
    
    def to_dict(self):
        return {
            'agentID': self.agentID,
            'name': self.name,
            'description': self.description,
            'system_prompt': self.system_prompt,
            'model': self.model,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'created_by': self.created_by,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'share_token': self.share_token,
            'view_count': self.view_count,
            'creator_name': self.creator.name if self.creator else None
        }
