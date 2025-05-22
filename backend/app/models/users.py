from app.db import db
from sqlalchemy.dialects.mysql import ENUM

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    profile_picture = db.Column(db.String(255), default='', nullable=True)
    membership = db.Column(ENUM('basic', 'premium'), default='basic')
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    last_login = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    post_limit = db.Column(db.Integer, default=2)



    # JUST AN EXAMPLE THIS MY SSD SETUP WE USE SQLALCHEMY TO TALK TO MYSQL AS A ORM
