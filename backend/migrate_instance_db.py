#!/usr/bin/env python3
"""
Database migration script - Fix instance/app.db database
Adds missing columns to market_posts table
"""
import sqlite3
import shutil
import os
from datetime import datetime

def backup_database(db_path):
    """Create a backup of the database"""
    backup_path = db_path.replace('.db', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db')
    shutil.copy2(db_path, backup_path)
    print(f"✅ Backup created: {backup_path}")
    return backup_path

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in the table"""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def add_missing_columns():
    """Add missing columns to market_posts table in instance/app.db"""
    db_path = 'instance/app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found!")
        return False
    
    # Create backup
    backup_path = backup_database(db_path)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List of columns to add with their definitions
        columns_to_add = [
            ('status', 'VARCHAR(20) DEFAULT "active"'),
            ('type', 'VARCHAR(20) DEFAULT "product"'),
            ('approved', 'BOOLEAN DEFAULT FALSE'),
            ('priority', 'VARCHAR(20) DEFAULT "normal"'),
            ('quality_grade', 'VARCHAR(10) DEFAULT NULL'),
            ('harvest_date', 'DATE DEFAULT NULL'),
            ('expiry_date', 'DATE DEFAULT NULL'),
            ('accepted_by', 'INTEGER DEFAULT NULL'),
            ('view_count', 'INTEGER DEFAULT 0'),
            ('interest_count', 'INTEGER DEFAULT 0')
        ]
        
        # Add each column if it doesn't exist
        for column_name, column_definition in columns_to_add:
            if not check_column_exists(cursor, 'market_posts', column_name):
                alter_query = f"ALTER TABLE market_posts ADD COLUMN {column_name} {column_definition}"
                cursor.execute(alter_query)
                print(f"✅ Added column: {column_name}")
            else:
                print(f"⏭️ Column already exists: {column_name}")
        
        # Commit changes
        conn.commit()
        
        # Verify the schema
        cursor.execute("PRAGMA table_info(market_posts)")
        columns = cursor.fetchall()
        print(f"\n✅ Migration completed! Market_posts table now has {len(columns)} columns:")
        for col in columns:
            print(f"   - {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        # Restore backup
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, db_path)
            print(f"🔄 Database restored from backup")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration for instance/app.db...")
    success = add_missing_columns()
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")