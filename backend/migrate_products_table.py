#!/usr/bin/env python3
"""
Database migration script to add discount and is_featured fields to products table
"""
from app import app
from extensions import db
from sqlalchemy import text

def migrate_products_table():
    with app.app_context():
        try:
            # Check if columns already exist
            result = db.session.execute(text("PRAGMA table_info(products)"))
            columns = [row[1] for row in result.fetchall()]
            
            print(f"Current columns in products table: {columns}")
            
            # Add discount column if it doesn't exist
            if 'discount' not in columns:
                print("Adding discount column...")
                db.session.execute(text("ALTER TABLE products ADD COLUMN discount FLOAT DEFAULT 0.0"))
                print("✅ Added discount column")
            else:
                print("✅ discount column already exists")
            
            # Add is_featured column if it doesn't exist
            if 'is_featured' not in columns:
                print("Adding is_featured column...")
                db.session.execute(text("ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0"))
                print("✅ Added is_featured column")
            else:
                print("✅ is_featured column already exists")
            
            db.session.commit()
            print("🎉 Database migration completed successfully!")
            
            # Verify the migration
            result = db.session.execute(text("PRAGMA table_info(products)"))
            new_columns = [row[1] for row in result.fetchall()]
            print(f"Updated columns in products table: {new_columns}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    migrate_products_table()