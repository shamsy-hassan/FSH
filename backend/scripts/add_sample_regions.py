import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions import db
from models.agroclimate import Region

def add_sample_regions():
    regions = [
        Region(name='Western', latitude=0.4532, longitude=34.0219, altitude=1500, soil_type='Clay', average_rainfall=1800),
        Region(name='Eastern', latitude=-1.2546, longitude=37.8957, altitude=1200, soil_type='Sandy', average_rainfall=900),
        Region(name='Northern', latitude=3.1186, longitude=35.5616, altitude=800, soil_type='Loam', average_rainfall=600),
        Region(name='Coastal', latitude=-4.0435, longitude=39.6682, altitude=50, soil_type='Sandy', average_rainfall=1100),
    ]
    db.session.bulk_save_objects(regions)
    db.session.commit()
    print('Sample regions added.')

if __name__ == '__main__':
    from app import app
    with app.app_context():
        add_sample_regions()
