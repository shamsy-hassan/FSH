#!/usr/bin/env python3
"""
Database migration script to remove difficulty column from skills table
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app import app
from extensions import db
from models.skill import Skill
from sqlalchemy import text

def migrate_remove_difficulty():
    """Remove difficulty column from skills table"""
    with app.app_context():
        try:
            # Check if difficulty column exists
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(skills)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'difficulty' in columns:
                    print("🔄 Removing difficulty column from skills table...")
                    
                    # Step 1: Create a backup table with the new structure
                    conn.execute(text("""
                        CREATE TABLE skills_new (
                            id INTEGER PRIMARY KEY,
                            category_id INTEGER NOT NULL,
                            title VARCHAR(200) NOT NULL,
                            description TEXT,
                            content TEXT,
                            estimated_time VARCHAR(50),
                            tools_required TEXT,
                            materials_required TEXT,
                            is_active BOOLEAN DEFAULT 1,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (category_id) REFERENCES skill_categories(id)
                        )
                    """))
                    
                    # Step 2: Copy data from old table to new table (excluding difficulty)
                    conn.execute(text("""
                        INSERT INTO skills_new (
                            id, category_id, title, description, content, 
                            estimated_time, tools_required, materials_required, 
                            is_active, created_at, updated_at
                        )
                        SELECT 
                            id, category_id, title, description, content,
                            estimated_time, tools_required, materials_required,
                            is_active, created_at, updated_at
                        FROM skills
                    """))
                    
                    # Step 3: Drop the old table
                    conn.execute(text("DROP TABLE skills"))
                    
                    # Step 4: Rename the new table
                    conn.execute(text("ALTER TABLE skills_new RENAME TO skills"))
                    
                    # Commit the transaction
                    conn.commit()
                    
                    print("✅ Successfully removed difficulty column from skills table")
                    
                else:
                    print("ℹ️  Difficulty column not found in skills table - no migration needed")
                
        except Exception as e:
            print(f"❌ Error during migration: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    migrate_remove_difficulty()