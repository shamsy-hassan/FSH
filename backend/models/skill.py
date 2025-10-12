#backend/models/skill.py
from extensions import db
import datetime

class SkillCategory(db.Model):
    __tablename__ = 'skill_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    image = db.Column(db.String(255))
    
    # Relationships
    skills = db.relationship('Skill', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image': self.image
        }

class Skill(db.Model):
    __tablename__ = 'skills'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('skill_categories.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)  # Detailed instructions or article
    estimated_time = db.Column(db.String(50))  # e.g., "2 hours", "1 day"
    tools_required = db.Column(db.Text)
    materials_required = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    videos = db.relationship('SkillVideo', backref='skill', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'estimated_time': self.estimated_time,
            'tools_required': self.tools_required,
            'materials_required': self.materials_required,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'videos': [video.to_dict() for video in self.videos]
        }

class SkillVideo(db.Model):
    __tablename__ = 'skill_videos'
    
    id = db.Column(db.Integer, primary_key=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    video_url = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(255))
    duration = db.Column(db.Integer)  # in seconds
    upload_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'skill_id': self.skill_id,
            'title': self.title,
            'description': self.description,
            'video_url': self.video_url,
            'thumbnail_url': self.thumbnail_url,
            'duration': self.duration,
            'upload_date': self.upload_date.isoformat(),
            'is_active': self.is_active
        }