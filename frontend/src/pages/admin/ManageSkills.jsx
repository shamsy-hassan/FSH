import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiVideo, FiPlay, 
  FiFilter, FiSearch, FiX, FiCheck, FiClock, FiTool, FiPackage 
} from 'react-icons/fi';

const categories = [
  { id: 'crop-production', name: 'Crop Production', icon: '🌱' },
  { id: 'livestock', name: 'Livestock Management', icon: '🐄' },
  { id: 'equipment', name: 'Farm Equipment', icon: '🚜' },
  { id: 'irrigation', name: 'Irrigation & Water', icon: '💧' },
  { id: 'organic', name: 'Organic Farming', icon: '🌿' },
  { id: 'post-harvest', name: 'Post-Harvest', icon: '🍎' },
  { id: 'business', name: 'Farm Business', icon: '📊' },
  { id: 'specialty', name: 'Specialty Crops', icon: '🌾' },
  { id: 'poultry', name: 'Poultry & Animals', icon: '🐓' },
  { id: 'agroforestry', name: 'Agroforestry', icon: '🌳' },
  { id: 'digital', name: 'Digital Farming', icon: '📱' },
  { id: 'technical', name: 'Technical Skills', icon: '🛠️' }
];

const difficulties = [
  { value: 'beginner', label: '🌱 Beginner', color: 'green' },
  { value: 'intermediate', label: '🌿 Intermediate', color: 'blue' },
  { value: 'advanced', label: '🌳 Advanced', color: 'purple' }
];

export default function ManageSkills() {
  // State Management
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('skills');
  
  // Skill Form State
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({
    category_id: "",
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    estimated_time: "",
    tools_required: "",
    materials_required: "",
    is_active: true
  });

  // Video Form State
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [selectedSkillForVideo, setSelectedSkillForVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({
    skill_id: '',
    title: '',
    description: '',
    video_url: '',
    video_file: null,
    thumbnail_url: '',
    duration: '',
    is_active: true
  });

  // Video Player State
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agriConnectAPI.skill.getSkills(null, null);
      setSkills(data.skills || []);
    } catch (err) {
      setError('Failed to fetch skills');
      console.error("Fetch skills error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetSkillForm = () => {
    setSkillForm({
      category_id: "",
      title: "",
      description: "",
      content: "",
      difficulty: "beginner",
      estimated_time: "",
      tools_required: "",
      materials_required: "",
      is_active: true
    });
    setEditingSkill(null);
    setShowSkillForm(false);
  };

  const resetVideoForm = () => {
    setVideoForm({
      skill_id: '',
      title: '',
      description: '',
      video_url: '',
      video_file: null,
      thumbnail_url: '',
      duration: '',
      is_active: true
    });
    setSelectedSkillForVideo(null);
    setShowVideoForm(false);
  };

  const openVideoPlayer = (video, skillTitle) => {
    setSelectedVideo({ ...video, skillTitle });
    setShowVideoPlayer(true);
  };

  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSkill) {
        await agriConnectAPI.skill.updateSkill(editingSkill.id, skillForm);
      } else {
        await agriConnectAPI.skill.createSkill(skillForm);
      }
      await fetchSkills();
      resetSkillForm();
      setError(null);
    } catch (err) {
      setError(editingSkill ? 'Failed to update skill' : 'Failed to create skill');
      console.error("Skill submit error:", err);
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoForm.video_url && !videoForm.video_file) {
      setError('Please provide either a video URL or upload a video file');
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Determine skill_id
      const skillId = videoForm.skill_id || selectedSkillForVideo?.id;
      console.log('🎯 Skill ID determination:', {
        'videoForm.skill_id': videoForm.skill_id,
        'selectedSkillForVideo?.id': selectedSkillForVideo?.id,
        'final skillId': skillId
      });
      
      if (!skillId) {
        setError('Please select a skill for the video');
        return;
      }
      
      // Add non-file fields first
      formData.append('skill_id', skillId.toString());
      formData.append('title', videoForm.title);
      formData.append('description', videoForm.description || '');
      formData.append('is_active', videoForm.is_active);
      
      if (videoForm.thumbnail_url) {
        formData.append('thumbnail_url', videoForm.thumbnail_url);
      }
      
      if (videoForm.duration) {
        formData.append('duration', videoForm.duration);
      }

      // Handle video source
      if (videoForm.video_file) {
        console.log('📁 Uploading video file:', videoForm.video_file.name);
        formData.append('video_file', videoForm.video_file);
      } else if (videoForm.video_url) {
        console.log('🔗 Using video URL:', videoForm.video_url);
        formData.append('video_url', videoForm.video_url);
      }

      // Debug FormData contents
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      await agriConnectAPI.skill.addSkillVideo(formData);
      await fetchSkills();
      resetVideoForm();
      setError(null);
      console.log('✅ Video added successfully');
    } catch (err) {
      const errorMsg = 'Failed to add video: ' + (err.response?.data?.error || err.message);
      setError(errorMsg);
      console.error('❌ Video submit error:', err);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill and all its videos?")) return;
    try {
      await agriConnectAPI.skill.deleteSkill(id);
      await fetchSkills();
      setError(null);
    } catch (err) {
      setError('Failed to delete skill');
      console.error("Delete skill error:", err);
    }
  };

  const handleToggleSkillStatus = async (skill) => {
    try {
      const updatedData = { ...skill, is_active: !skill.is_active };
      await agriConnectAPI.skill.updateSkill(skill.id, updatedData);
      await fetchSkills();
      setError(null);
    } catch (err) {
      setError('Failed to update skill status');
      console.error('Toggle skill status error:', err);
    }
  };

  const startEditingSkill = (skill) => {
    setSkillForm({
      category_id: skill.category_id,
      title: skill.title,
      description: skill.description,
      content: skill.content || '',
      difficulty: skill.difficulty,
      estimated_time: skill.estimated_time || '',
      tools_required: skill.tools_required || '',
      materials_required: skill.materials_required || '',
      is_active: skill.is_active
    });
    setEditingSkill(skill);
    setShowSkillForm(true);
  };

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  const getDifficultyConfig = (difficulty) => {
    return difficulties.find(d => d.value === difficulty) || difficulties[0];
  };

  const formatVideoUrl = (url) => {
    if (!url) return '';
    
    console.log('🎥 Formatting video URL:', url);
    console.log('🔍 URL type check:', {
      isHttp: url.startsWith('http'),
      hasStaticUploads: url.includes('/static/uploads/'),
      startsWithStaticUploads: url.startsWith('/static/uploads/')
    });
    
    // Handle YouTube URLs - comprehensive parsing (including mobile)
    if (url.includes('youtube.com/watch') || url.includes('m.youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        console.log('✅ YouTube watch URL → embed:', embedUrl);
        return embedUrl;
      }
    }
    
    if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        console.log('✅ YouTube short URL → embed:', embedUrl);
        return embedUrl;
      }
    }
    
    // Handle YouTube embed URLs (already formatted)
    if (url.includes('youtube.com/embed/')) {
      console.log('✅ Already YouTube embed URL:', url);
      return url;
    }
    
    // Handle Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        const videoId = match[1];
        const embedUrl = `https://player.vimeo.com/video/${videoId}`;
        console.log('✅ Vimeo URL → embed:', embedUrl);
        return embedUrl;
      }
    }
    
    // Handle local file URLs
    if (!url.startsWith('http')) {
      // Check if URL already starts with /static/uploads/ to avoid doubling
      if (url.startsWith('/static/uploads/')) {
        const localUrl = `http://localhost:5000${url}`;
        console.log('✅ Local file URL (full path):', localUrl);
        return localUrl;
      } else {
        const localUrl = `http://localhost:5000/static/uploads/${url}`;
        console.log('✅ Local file URL (filename only):', localUrl);
        return localUrl;
      }
    }
    
    // Handle direct video URLs
    console.log('✅ Direct video URL:', url);
    return url;
  };

  const isYouTubeUrl = (url) => {
    return url && (
      url.includes('youtube.com') || 
      url.includes('youtu.be') ||
      url.includes('youtube.com/embed/') ||
      url.includes('m.youtube.com')
    );
  };

  const isVimeoUrl = (url) => {
    return url && (url.includes('vimeo.com') || url.includes('player.vimeo.com'));
  };

  const isEmbeddableUrl = (url) => {
    return isYouTubeUrl(url) || isVimeoUrl(url);
  };

  const getFilteredSkills = () => {
    return skills.filter(skill => {
      const matchesCategory = filters.category === 'all' || skill.category_id === filters.category;
      const matchesDifficulty = filters.difficulty === 'all' || skill.difficulty === filters.difficulty;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && skill.is_active) || 
        (filters.status === 'inactive' && !skill.is_active);
      const matchesSearch = !filters.search || 
        skill.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        skill.description.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesCategory && matchesDifficulty && matchesStatus && matchesSearch;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading skills management...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-green-700 mb-2">Skills Management Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Create, manage, and organize agricultural training content with video tutorials
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiX className="text-red-500 w-5 h-5 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-2 flex space-x-2">
            {[
              { id: 'skills', label: 'Skills Management', icon: FiTool },
              { id: 'videos', label: 'Video Library', icon: FiVideo },
              { id: 'analytics', label: 'Analytics', icon: FiEye }
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Skills Tab Content */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Basic Skills Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">Skills Overview</h3>
                <motion.button
                  onClick={() => setShowSkillForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="inline w-4 h-4 mr-2" />
                  Create New Skill
                </motion.button>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map((skill, index) => {
                  const difficultyConfig = getDifficultyConfig(skill.difficulty);
                  const categoryIcon = categories.find(c => c.id === skill.category_id)?.icon || '📚';
                  
                  return (
                    <motion.div
                      key={skill.id}
                      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{categoryIcon}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              difficultyConfig.color === 'green' ? 'bg-green-100 text-green-800' :
                              difficultyConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {difficultyConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${skill.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-xs font-medium ${skill.is_active ? 'text-green-700' : 'text-red-700'}`}>
                              {skill.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{skill.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{skill.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <FiClock className="w-4 h-4 mr-1" />
                            {skill.estimated_time || 'Not specified'}
                          </div>
                          <div className="flex items-center text-blue-600">
                            <FiVideo className="w-4 h-4 mr-1" />
                            {skill.videos?.length || 0} videos
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex space-x-2">
                          <motion.button
                            onClick={() => {
                              setSelectedSkillForVideo(skill);
                              setVideoForm({ ...videoForm, skill_id: skill.id });
                              setShowVideoForm(true);
                            }}
                            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiVideo className="inline w-4 h-4 mr-1" />
                            Add Video
                          </motion.button>
                          
                          <motion.button
                            onClick={() => startEditingSkill(skill)}
                            className="flex-1 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiEdit className="inline w-4 h-4 mr-1" />
                            Edit
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Video Library Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Video Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.flatMap(skill => 
                  (skill.videos || []).map(video => ({ ...video, skillTitle: skill.title }))
                ).map((video, index) => (
                  <motion.div
                    key={video.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    onClick={() => openVideoPlayer(video, video.skillTitle)}
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                      {isEmbeddableUrl(video.video_url) ? (
                        <iframe 
                          className="w-full h-48"
                          src={formatVideoUrl(video.video_url)}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                          allowFullScreen
                          loading="lazy"
                          onError={(e) => {
                            console.error('❌ Video iframe failed to load:', video.video_url);
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : (
                        <video 
                          className="w-full h-48 object-cover"
                          controls
                          preload="metadata"
                          poster={video.thumbnail_url}
                          onError={(e) => {
                            console.error('❌ Video failed to load:', video.video_url);
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        >
                          <source src={formatVideoUrl(video.video_url)} type="video/mp4" />
                          <source src={formatVideoUrl(video.video_url)} type="video/webm" />
                          <source src={formatVideoUrl(video.video_url)} type="video/mov" />
                          <source src={formatVideoUrl(video.video_url)} type="video/avi" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      
                      {/* Error fallback */}
                      <div className="hidden absolute inset-0 items-center justify-center bg-gray-100 text-gray-500" style={{display: 'none'}}>
                        <div className="text-center">
                          <FiVideo className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Video failed to load</p>
                          <p className="text-xs">{video.video_url}</p>
                        </div>
                      </div>
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-4 transform scale-75 hover:scale-100 transition-transform">
                          <FiPlay className="w-8 h-8 text-gray-800" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{video.title}</h4>
                      <p className="text-sm text-gray-600">Skill: {video.skillTitle}</p>
                      <div className="mt-2 flex items-center text-blue-600 text-sm">
                        <FiPlay className="w-4 h-4 mr-1" />
                        <span>Click to watch</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Analytics Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiTool className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">{skills.length}</h4>
                  <p className="text-sm text-gray-600">Total Skills</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiEye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">{skills.filter(s => s.is_active).length}</h4>
                  <p className="text-sm text-gray-600">Active Skills</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiVideo className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {skills.reduce((sum, skill) => sum + (skill.videos?.length || 0), 0)}
                  </h4>
                  <p className="text-sm text-gray-600">Total Videos</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiFilter className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {categories.filter(cat => skills.some(s => s.category_id === cat.id)).length}
                  </h4>
                  <p className="text-sm text-gray-600">Categories Used</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showSkillForm && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {editingSkill ? 'Edit Skill' : 'Create New Skill'}
                    </h3>
                    <button onClick={resetSkillForm}>
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSkillSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={skillForm.category_id}
                        onChange={(e) => setSkillForm({ ...skillForm, category_id: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skill Title *</label>
                      <input
                        type="text"
                        value={skillForm.title}
                        onChange={(e) => setSkillForm({ ...skillForm, title: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter skill title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={skillForm.description}
                        onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Brief description of the skill..."
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={resetSkillForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {editingSkill ? 'Update Skill' : 'Create Skill'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVideoForm && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      Add Video{selectedSkillForVideo ? ` to "${selectedSkillForVideo.title}"` : ''}
                    </h3>
                    <button onClick={resetVideoForm}>
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleVideoSubmit} className="space-y-4">
                    {!selectedSkillForVideo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Skill *</label>
                        <select
                          value={videoForm.skill_id}
                          onChange={(e) => {
                            const skillId = parseInt(e.target.value);
                            const skill = skills.find(s => s.id === skillId);
                            setSelectedSkillForVideo(skill);
                            setVideoForm({ ...videoForm, skill_id: skillId });
                          }}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Choose a skill...</option>
                          {skills.map(skill => (
                            <option key={skill.id} value={skill.id}>
                              {skill.title} - {getCategoryName(skill.category_id)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
                      <input
                        type="text"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter video title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📹 Video Source
                      </label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">🔗 Paste video URL (YouTube, Vimeo, etc.)</label>
                          <input
                            type="url"
                            value={videoForm.video_url}
                            onChange={(e) => {
                              const url = e.target.value;
                              console.log('🔗 URL input changed:', url);
                              setVideoForm({ ...videoForm, video_url: url, video_file: null });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or https://vimeo.com/..."
                          />
                          {videoForm.video_url && (
                            <div className="mt-1 text-xs">
                              {isYouTubeUrl(videoForm.video_url) && <span className="text-red-600">📺 YouTube</span>}
                              {isVimeoUrl(videoForm.video_url) && <span className="text-blue-600">🎬 Vimeo</span>}
                              {!isEmbeddableUrl(videoForm.video_url) && <span className="text-gray-600">🌐 Direct URL</span>}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span className="text-sm font-medium">OR</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">📁 Upload video file from your computer</label>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/mov,video/avi,video/mkv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              console.log('📁 File selected:', file?.name, file?.size);
                              setVideoForm({ ...videoForm, video_file: file, video_url: '' });
                            }}
                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            💡 Supported formats: MP4, WebM, MOV, AVI, MKV (Max 100MB)
                          </p>
                          {videoForm.video_file && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <div className="flex items-center space-x-2">
                                <FiCheck className="text-green-600" />
                                <span className="text-green-700">File selected: {videoForm.video_file.name}</span>
                              </div>
                              <div className="text-green-600 text-xs">
                                Size: {(videoForm.video_file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(videoForm.video_url || videoForm.video_file) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                          <FiPlay className="mr-2" />
                          Video Preview
                        </h4>
                        
                        {videoForm.video_file ? (
                          <div className="space-y-2">
                            <div className="text-sm text-blue-700">
                              📁 <strong>Uploaded file:</strong> {videoForm.video_file.name}
                            </div>
                            <div className="text-xs text-blue-600">
                              Size: {(videoForm.video_file.size / 1024 / 1024).toFixed(2)} MB | Type: {videoForm.video_file.type}
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                              ⚠️ File preview will be available after upload
                            </div>
                          </div>
                        ) : isEmbeddableUrl(videoForm.video_url) ? (
                          <div className="space-y-2">
                            <div className="text-sm text-blue-700">
                              {isYouTubeUrl(videoForm.video_url) && '📺 YouTube video'}
                              {isVimeoUrl(videoForm.video_url) && '🎬 Vimeo video'}
                            </div>
                            <iframe 
                              className="w-full h-48 rounded-md"
                              src={formatVideoUrl(videoForm.video_url)}
                              title="Video Preview"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                              allowFullScreen
                              onLoad={() => console.log('✅ Preview iframe loaded successfully')}
                              onError={() => console.error('❌ Preview iframe failed to load')}
                            />
                          </div>
                        ) : videoForm.video_url ? (
                          <div className="space-y-2">
                            <div className="text-sm text-blue-700">
                              🌐 <strong>Direct video URL:</strong> {videoForm.video_url}
                            </div>
                            <video 
                              className="w-full h-48 rounded-md"
                              controls
                              preload="metadata"
                              onLoad={() => console.log('✅ Preview video loaded successfully')}
                              onError={() => console.error('❌ Preview video failed to load')}
                            >
                              <source src={formatVideoUrl(videoForm.video_url)} type="video/mp4" />
                              <source src={formatVideoUrl(videoForm.video_url)} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={resetVideoForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Video
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player Modal */}
        <AnimatePresence>
          {showVideoPlayer && selectedVideo && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedVideo.title}</h3>
                      <p className="text-gray-600">Skill: {selectedVideo.skillTitle}</p>
                    </div>
                    <button 
                      onClick={closeVideoPlayer}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="bg-black rounded-lg overflow-hidden mb-4">
                    {isEmbeddableUrl(selectedVideo.video_url) ? (
                      <iframe 
                        className="w-full h-96"
                        src={formatVideoUrl(selectedVideo.video_url)}
                        title={selectedVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        className="w-full h-96"
                        controls
                        autoPlay
                        poster={selectedVideo.thumbnail_url}
                      >
                        <source src={formatVideoUrl(selectedVideo.video_url)} type="video/mp4" />
                        <source src={formatVideoUrl(selectedVideo.video_url)} type="video/webm" />
                        <source src={formatVideoUrl(selectedVideo.video_url)} type="video/mov" />
                        <source src={formatVideoUrl(selectedVideo.video_url)} type="video/avi" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                  
                  {selectedVideo.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                      <p className="text-gray-600">{selectedVideo.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}