#!/usr/bin/env python3

from app import app
from models.sacco import Sacco
from extensions import db
import datetime
from decimal import Decimal

with app.app_context():
    # Create a SACCO directly using the model
    print("Creating a SACCO directly in the database...")
    
    sacco = Sacco(
        name="Direct Test SACCO",
        description="A SACCO created directly through database",
        registration_number="DIRECT001",
        location="Direct Location",
        region="Central",
        founded_date=datetime.date(2024, 1, 1),
        total_members=0,
        total_assets=Decimal('0.00')
    )
    
    try:
        db.session.add(sacco)
        db.session.commit()
        print(f"✅ SACCO created successfully with ID: {sacco.id}")
        
        # Verify it was created
        all_saccos = Sacco.query.all()
        print(f"Total SACCOs in database: {len(all_saccos)}")
        for s in all_saccos:
            print(f"  - ID: {s.id}, Name: {s.name}, Active: {s.is_active}, Region: {s.region}")
            
    except Exception as e:
        print(f"❌ Error creating SACCO: {e}")
        db.session.rollback()