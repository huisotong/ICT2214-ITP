from app.db import db
from sqlalchemy.orm import synonym

class User(db.Model):
    __tablename__ = 'Users'
    __table_args__ = {'schema': 'dbo'}

    userID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    mobileNumber = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(10), nullable=False)
    studentID = db.Column(db.Integer, nullable=True)


    username = synonym("name")