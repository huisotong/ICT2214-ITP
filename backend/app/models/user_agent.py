from app.db import db

class UserAgent(db.Model):
    __tablename__ = 'UserAgent'
    __table_args__ = {'schema': 'dbo'}
    
    id = db.Column(db.Integer, primary_key=True)
    userID = db.Column(db.Integer, db.ForeignKey('dbo.Users.userID'), nullable=False)
    agentID = db.Column(db.String(50), db.ForeignKey('dbo.Agent.agentID'), nullable=False)
    is_owner = db.Column(db.Boolean, nullable=False, default=False)
    added_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    # Relationships
    user = db.relationship('User', backref='user_agents')
    agent = db.relationship('Agent', backref='user_agents')
    
    # Unique constraint to prevent duplicate entries
    __table_args__ = (
        db.UniqueConstraint('userID', 'agentID', name='unique_user_agent'),
        {'schema': 'dbo'}
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'userID': self.userID,
            'agentID': self.agentID,
            'is_owner': self.is_owner,
            'added_at': self.added_at.isoformat() if self.added_at else None,
            'agent': self.agent.to_dict() if self.agent else None
        }
