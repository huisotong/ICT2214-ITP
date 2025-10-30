#!/usr/bin/env python3
"""
Migration script to add marketplace tables to the database.
Run this script to create the Agent and UserAgent tables.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from app.db import db
from app.models.agent import Agent
from app.models.user_agent import UserAgent

def create_marketplace_tables():
    """Create the marketplace tables in the database."""
    app = create_app()
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Successfully created marketplace tables:")
            print("   - Agent table")
            print("   - UserAgent table")
            print("   - Updated existing tables if needed")
            
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False
    
    return True

def verify_tables():
    """Verify that the tables were created successfully."""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if Agent table exists and has the right structure
            agent_columns = db.inspect(db.engine).get_columns('Agent')
            if agent_columns:
                print("✅ Agent table verified with columns:")
                for col in agent_columns:
                    print(f"   - {col['name']} ({col['type']})")
            else:
                print("❌ Agent table not found")
                return False
                
            # Check if UserAgent table exists
            user_agent_columns = db.inspect(db.engine).get_columns('UserAgent')
            if user_agent_columns:
                print("✅ UserAgent table verified with columns:")
                for col in user_agent_columns:
                    print(f"   - {col['name']} ({col['type']})")
            else:
                print("❌ UserAgent table not found")
                return False
                
        except Exception as e:
            print(f"❌ Error verifying tables: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting marketplace migration...")
    
    if create_marketplace_tables():
        print("\n🔍 Verifying table creation...")
        if verify_tables():
            print("\n✅ Migration completed successfully!")
            print("\nYou can now:")
            print("1. Start the backend server")
            print("2. Access the marketplace at /marketplace")
            print("3. Create and share agents")
        else:
            print("\n❌ Migration verification failed")
            sys.exit(1)
    else:
        print("\n❌ Migration failed")
        sys.exit(1)
