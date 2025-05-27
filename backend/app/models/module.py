from app.db import db

class Module(db.Model):
    __tablename__ = 'Module'
    __table_args__ = {'schema': 'dbo'}
    
    moduleID = db.Column(db.String(50), primary_key=True, nullable=False)
    moduleName = db.Column(db.String(255), nullable=False)
    moduleDesc = db.Column(db.Text, nullable=True)
