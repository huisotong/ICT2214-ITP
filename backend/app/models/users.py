from app.db import db

class User(db.Model):
    __tablename__ = 'Users'
    __table_args__ = {'schema': 'dbo'}

    userID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    mobileNumber = db.Column(db.String(20), nullable=True)
    Role = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {
            "userID": self.userID,
            "email": self.email,
            "mobileNumber": self.mobileNumber,
            "Role": self.Role
            # ⚠️ Do not include password here for security!
        }