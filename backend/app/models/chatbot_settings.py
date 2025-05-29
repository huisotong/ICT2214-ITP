from app.db import db

class ChatbotSettings(db.Model):
    __tablename__ = 'ChatbotSettings'
    __table_args__ = {'schema': 'dbo'}
    
    chatbotID = db.Column(db.Integer, primary_key=True)
    moduleID = db.Column(db.String(50), db.ForeignKey('dbo.Module.moduleID'), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    system_prompt = db.Column(db.Text, nullable=False)
    max_tokens = db.Column(db.Integer, nullable=False)
    
    # Relationship with Module
    module = db.relationship('Module', backref='chatbot_settings')