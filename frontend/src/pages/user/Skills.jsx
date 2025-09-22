import { useState, useEffect } from 'react';
import { agriConnectAPI } from '../../services/api';

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
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [expandedSkillIds, setExpandedSkillIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [completedSkills, setCompletedSkills] = useState([])

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        {error}
        <button 
          onClick={() => setError(null)}
          className="float-right text-red-800 hover:text-red-900"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-green-800">Agricultural Skills & Training</h1>
        <p className="text-lg text-gray-600 mt-2">Discover comprehensive training materials and video tutorials to enhance your farming expertise</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Filters</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Skills</label>
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-2">Your Progress</h3>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm">
                Completed: <span className="font-semibold">{completedSkills.length}</span> of <span className="font-semibold">{skills.length}</span> skills
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(completedSkills.length / skills.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4">
          {filteredSkills.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No skills found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSkills.map(skill => {
                const isExpanded = expandedSkillIds.includes(skill.id);
                const isCompleted = completedSkills.includes(skill.id);
                const category = categories.find(c => c.id === skill.category_id) || { name: 'Unknown', icon: '❓' };
                const difficultyStyle = difficultyStyles[skill.difficulty] || { color: 'gray', icon: '📚' };
                
                return (
                  <div
                    key={skill.id}
                    className={`bg-white rounded-xl shadow-sm p-6 border transition-all duration-300 ${isExpanded ? 'border-green-300' : 'border-gray-100'} hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{skill.title}</h3>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                          {category.icon} {category.name}
                        </span>
                      </div>
                      <button
                        onClick={() => markSkillCompleted(skill.id)}
                        className={`p-1 rounded-full ${isCompleted ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600'}`}
                        title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
                      >
                        {isCompleted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {skill.estimated_time || 'Not specified'}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${difficultyStyle.color}-100 text-${difficultyStyle.color}-800`}>
                          {difficultyStyle.icon} {skill.difficulty}
                        </span>
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {isExpanded ? skill.content || skill.description : skill.description}
                    </p>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Detailed Instructions:</h4>
                          <div className="text-gray-700 whitespace-pre-line">
                            {skill.content || skill.description}
                          </div>
                        </div>

                        {skill.tools_required && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Required Tools:</h4>
                            <div className="flex flex-wrap gap-2">
                              {skill.tools_required.split(',').map((tool, index) => (
                                <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                  {tool.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {skill.materials_required && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Required Materials:</h4>
                            <div className="flex flex-wrap gap-2">
                              {skill.materials_required.split(',').map((material, index) => (
                                <span key={index} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700">
                                  {material.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {skill.videos && skill.videos.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Instructional Videos:</h4>
                            <div className="space-y-4">
                              {skill.videos.map(video => (
                                <div key={video.id} className="bg-gray-50 rounded-lg p-4">
                                  <h5 className="font-semibold text-gray-800 mb-2">{video.title}</h5>
                                  {video.description && <p className="text-sm text-gray-600 mb-3">{video.description}</p>}
                                  <div className="aspect-w-16 aspect-h-9">
                                    <iframe 
                                      className="w-full h-48 rounded-md"
                                      src={video.video_url}
                                      title={video.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowFullScreen>
                                    </iframe>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">Duration: {formatDuration(video.duration)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => toggleExpand(skill.id)}
                        className="text-green-600 hover:text-green-800 font-medium flex items-center"
                      >
                        {isExpanded ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Show Less
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            View Full Guide
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => markSkillCompleted(skill.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-700'}`}
                      >
                        {isCompleted ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}