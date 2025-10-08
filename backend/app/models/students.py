# app/models/students.py
from app.db import db

class Student(db.Model):
    __tablename__ = 'Students'

    studentID = db.Column(db.String(10), primary_key=True)
    fullName = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    mobileNumber = db.Column(db.String(20), nullable=True)
    awsAccountId = db.Column(db.String(255), nullable=True)
