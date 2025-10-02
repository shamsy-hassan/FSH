import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { FiPlay, FiEye, FiClock, FiCheckCircle, FiBook, FiVideo, FiSearch, FiFilter } from 'react-icons/fi';

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
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

// Difficulty styles
const difficultyStyles = {
  beginner: { color: 'green', icon: '🌱' },
  intermediate: { color: 'blue', icon: '🌿' },
  advanced: { color: 'purple', icon: '🌳' }
};

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [expandedSkillIds, setExpandedSkillIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSkills, setCompletedSkills] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchSkills();
  }, [categoryFilter, difficultyFilter]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agriConnectAPI.skill.getSkills(
        categoryFilter === 'all' ? null : categoryFilter,
        difficultyFilter === 'all' ? null : difficultyFilter
      );
      setSkills(data.skills || []);
    } catch (err) {
      setError('Failed to fetch skills');
      console.error('Error fetching skills:', err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const markSkillCompleted = (skillId) => {
    setCompletedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId) 
        : [...prev, skillId]
    );
  };

  // Enhanced video URL formatting function
  const formatVideoUrl = (url) => {
    if (!url) return '';
    
    console.log('🎥 Formatting video URL:', url);
    
    // Handle YouTube URLs
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
    
    // Handle local file URLs - check if it's already a full URL
    if (url.startsWith('http')) {
      console.log('✅ Already full URL:', url);
      return url;
    }
    
    // Handle local file paths
    if (url.startsWith('/static/uploads/')) {
      const localUrl = `http://localhost:5000${url}`;
      console.log('✅ Local file URL (full path):', localUrl);
      return localUrl;
    } else {
      const localUrl = `http://localhost:5000/static/uploads/${url}`;
      console.log('✅ Local file URL (filename only):', localUrl);
      return localUrl;
    }
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

  const openVideoPlayer = (video, skillTitle) => {
    setSelectedVideo({ ...video, skillTitle });
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = categoryFilter === 'all' || skill.category_id === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || skill.difficulty === difficultyFilter;
    const matchesSearch = skill.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedSkillIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading skills...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Skills</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <motion.button
            onClick={fetchSkills}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FiBook className="text-green-600" />
            Skills Development
          </h1>
          <p className="text-lg text-gray-600 mt-2">Discover comprehensive training materials and video tutorials to enhance your farming expertise</p>
        </motion.div>

        <motion.div 
          className="flex flex-col md:flex-row gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-lg border border-gray-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center gap-2">
              <FiFilter />
              Filters
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Skills</label>
              <motion.div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 transition-all"
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <motion.select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 transition-all"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                ))}
              </motion.select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <motion.select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 transition-all"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="all">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </motion.select>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-2">Your Progress</h3>
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-700 text-sm">
                  {completedSkills.length} of {filteredSkills.length} skills completed
                </p>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <motion.div 
                    className="bg-green-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${filteredSkills.length > 0 ? (completedSkills.length / filteredSkills.length) * 100 : 0}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex-1">
            <AnimatePresence>
              {filteredSkills.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-12"
                >
                  <div className="text-gray-400 text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Skills Found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                </motion.div>
              ) : (
                <motion.div className="space-y-6">
                  {filteredSkills.map((skill, index) => {
                    const isExpanded = expandedSkillIds.includes(skill.id);
                    const isCompleted = completedSkills.includes(skill.id);
                    const diffStyle = difficultyStyles[skill.difficulty] || difficultyStyles.beginner;

                    return (
                      <motion.div
                        key={skill.id}
                        className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">{skill.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${diffStyle.color}-100 text-${diffStyle.color}-700`}>
                                  {diffStyle.icon} {skill.difficulty}
                                </span>
                                {isCompleted && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-green-500"
                                  >
                                    <FiCheckCircle className="w-5 h-5" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-gray-600 mb-4">{skill.description}</p>
                              
                              <div className="flex items-center gap-4 mb-4">
                                {skill.category_id && (
                                  <span className="text-sm text-gray-500">
                                    {categories.find(c => c.id === skill.category_id)?.icon} {categories.find(c => c.id === skill.category_id)?.name}
                                  </span>
                                )}
                                {skill.duration && (
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <FiClock className="w-4 h-4" />
                                    {formatDuration(skill.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 border-t border-gray-100 pt-4"
                              >
                                {skill.content && (
                                  <motion.div 
                                    className="mb-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                  >
                                    <h4 className="font-medium text-gray-900 mb-2">Learning Content:</h4>
                                    <div className="prose prose-sm max-w-none text-gray-700">
                                      {skill.content}
                                    </div>
                                  </motion.div>
                                )}

                                {skill.videos && skill.videos.length > 0 && (
                                  <motion.div 
                                    className="mt-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                  >
                                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                      <FiVideo className="text-red-500" />
                                      Instructional Videos:
                                    </h4>
                                    <div className="space-y-4">
                                      {skill.videos.map((video, videoIndex) => (
                                        <motion.div 
                                          key={video.id} 
                                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3, delay: videoIndex * 0.1 }}
                                        >
                                          <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <FiPlay className="text-green-500" />
                                            {video.title}
                                          </h5>
                                          {video.description && <p className="text-sm text-gray-600 mb-3">{video.description}</p>}
                                          <div className="aspect-w-16 aspect-h-9 relative">
                                            {isEmbeddableUrl(video.video_url) ? (
                                              <iframe 
                                                className="w-full h-48 rounded-md"
                                                src={formatVideoUrl(video.video_url)}
                                                title={video.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                                                allowFullScreen
                                                onError={(e) => {
                                                  console.error('❌ Video iframe failed to load:', video.video_url);
                                                  e.target.style.display = 'none';
                                                  // Show error fallback
                                                  const fallback = e.target.nextSibling;
                                                  if (fallback) fallback.style.display = 'flex';
                                                }}
                                              />
                                            ) : (
                                              <video 
                                                className="w-full h-48 rounded-md object-cover"
                                                controls
                                                preload="metadata"
                                                poster={video.thumbnail_url}
                                                onError={(e) => {
                                                  console.error('❌ Video failed to load:', video.video_url);
                                                  e.target.style.display = 'none';
                                                  // Show error fallback
                                                  const fallback = e.target.nextSibling;
                                                  if (fallback) fallback.style.display = 'flex';
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
                                            <div 
                                              className="hidden absolute inset-0 items-center justify-center bg-gray-100 text-gray-500 rounded-md"
                                              style={{display: 'none'}}
                                            >
                                              <div className="text-center">
                                                <FiVideo className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-sm">Video failed to load</p>
                                                <p className="text-xs mt-1">{video.video_url}</p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                              <FiClock className="w-3 h-3" />
                                              Duration: {formatDuration(video.duration)}
                                            </p>
                                            <motion.button
                                              onClick={() => openVideoPlayer(video, skill.title)}
                                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                            >
                                              <FiEye className="w-3 h-3 inline mr-1" />
                                              Watch Full Screen
                                            </motion.button>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="mt-4 flex items-center justify-between">
                            <motion.button
                              onClick={() => toggleExpand(skill.id)}
                              className="text-green-600 hover:text-green-700 font-medium transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isExpanded ? 'Show Less' : 'Learn More'}
                            </motion.button>

                            <motion.button
                              onClick={() => markSkillCompleted(skill.id)}
                              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isCompleted ? (
                                <>
                                  <FiCheckCircle className="w-4 h-4 inline mr-1" />
                                  Completed
                                </>
                              ) : (
                                'Mark Complete'
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Video Player Modal */}
        <AnimatePresence>
          {selectedVideo && (
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
                      <FiEye className="w-6 h-6" />
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