#!/usr/bin/env python3

"""
Database migration script to add missing columns to market_posts table
"""

import sqlite3
import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate_database():
    """Add missing columns to market_posts table"""
    
    db_path = 'app.db'
    backup_path = 'app_backup.db'
    
    # Create backup
    print("Creating backup...")
    import shutil
    shutil.copy2(db_path, backup_path)
    print(f"Backup created: {backup_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # List of columns to add with their definitions
        new_columns = [
            ('status', 'VARCHAR(20)', "'active'"),
            ('type', 'VARCHAR(20)', "'product'"),
            ('approved', 'BOOLEAN', 'FALSE'),
            ('priority', 'VARCHAR(20)', "'normal'"),
            ('quality_grade', 'VARCHAR(10)', 'NULL'),
            ('harvest_date', 'DATE', 'NULL'),
            ('expiry_date', 'DATE', 'NULL'),
            ('accepted_by', 'INTEGER', 'NULL'),
            ('view_count', 'INTEGER', '0'),
            ('interest_count', 'INTEGER', '0')
        ]
        
        # Check which columns already exist
        cursor.execute('PRAGMA table_info(market_posts)')
        existing_columns = [col[1] for col in cursor.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Add missing columns
        for col_name, col_type, default_value in new_columns:
            if col_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE market_posts ADD COLUMN {col_name} {col_type} DEFAULT {default_value}"
                    print(f"Adding column: {alter_sql}")
                    cursor.execute(alter_sql)
                    print(f"✅ Added column: {col_name}")
                except Exception as e:
                    print(f"❌ Error adding column {col_name}: {e}")
            else:
                print(f"⏭️  Column {col_name} already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify the new schema
        cursor.execute('PRAGMA table_info(market_posts)')
        new_columns = cursor.fetchall()
        print("\nUpdated market_posts columns:")
        for col in new_columns:
            print(f"  {col[1]} {col[2]}")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        # Restore backup
        shutil.copy2(backup_path, db_path)
        print("Backup restored due to error")
        return False
    
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    print("Starting database migration...")
    success = migrate_database()
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)