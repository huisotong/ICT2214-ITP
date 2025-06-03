from datetime import datetime
from app.db import db

class ChatMessage(db.Model):
    __tablename__ = 'ChatMessage'
    __table_args__ = {'schema': 'dbo'}

    messageID = db.Column(db.Integer, primary_key=True)
    chatID = db.Column(db.Integer, db.ForeignKey('dbo.ChatHistory.historyID'), nullable=False)
    sender = db.Column(db.Enum('user', 'ai', name='sender_types'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    chat = db.relationship("ChatHistory", backref="chat_message")

