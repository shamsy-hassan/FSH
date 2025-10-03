#!/usr/bin/env python3
"""
Test script to identify the specific error in product creation
"""
from app import app
from models.ecommerce import Category, Product
from extensions import db
import json

def test_product_creation():
    with app.app_context():
        try:
            # First, create a test category if none exists
            category = Category.query.first()
            if not category:
                print("Creating test category...")
                category = Category(
                    name="Test Category",
                    type="seeds",
                    description="Test category for debugging"
                )
                db.session.add(category)
                db.session.commit()
                print(f"Created category with ID: {category.id}")
            else:
                print(f"Using existing category: {category.name} (ID: {category.id})")
            
            # Now try to create a product
            print("Creating test product...")
            product_data = {
                'name': 'Test Product',
                'description': 'Test product description',
                'price': 10.99,
                'category_id': category.id,
                'stock_quantity': 5,
                'brand': 'Test Brand',
                'weight': 1.5,
                'dimensions': '10x5x2',
                'is_active': True
            }
            
            product = Product(
                name=product_data['name'],
                description=product_data['description'],
                price=product_data['price'],
                category_id=product_data['category_id'],
                stock_quantity=product_data['stock_quantity'],
                brand=product_data['brand'],
                weight=product_data['weight'],
                dimensions=product_data['dimensions'],
                is_active=product_data['is_active']
            )
            
            db.session.add(product)
            db.session.commit()
            
            print(f"✅ Product created successfully!")
            print(f"   Product ID: {product.id}")
            print(f"   Product Name: {product.name}")
            print(f"   Product Dict: {product.to_dict()}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating product: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_product_creation()