from app import create_app
from app.db import db
from sqlalchemy import text

def migrate_for_agent_chats():
    app = create_app()
    with app.app_context():
        print("Attempting to modify ChatHistory table for agent chats...")
        try:
            # Modify the assignmentID column to allow NULL for agent chats
            db.session.execute(text("ALTER TABLE dbo.ChatHistory ALTER COLUMN assignmentID INT NULL"))
            print("✅ Successfully modified ChatHistory.assignmentID to allow NULL")
            
            # Add a new column to distinguish between module and agent chats
            db.session.execute(text("ALTER TABLE dbo.ChatHistory ADD agentID VARCHAR(50) NULL"))
            print("✅ Successfully added agentID column to ChatHistory")
            
            # Add foreign key constraint for agentID
            db.session.execute(text("ALTER TABLE dbo.ChatHistory ADD CONSTRAINT FK_ChatHistory_Agent FOREIGN KEY (agentID) REFERENCES dbo.Agent(agentID)"))
            print("✅ Successfully added foreign key constraint for agentID")
            
            db.session.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {e}")
            print("This might be because the changes were already applied.")

if __name__ == '__main__':
    migrate_for_agent_chats()
