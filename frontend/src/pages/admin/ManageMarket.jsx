import React, { useState, useEffect } from 'react';
import { agriConnectAPI } from '../../services/api';
import { FiSearch, FiFilter, FiRefreshCw, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiPlus, FiUpload, FiImage } from 'react-icons/fi';

function ManageMarket() {
  const [posts, setPosts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    category: '',
    location: '',
    region: ''
  });
  const [images, setImages] = useState([]);
  const units = ['kg', 'unit', 'bag', 'ton', 'liter'];
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.market.createPost(newPost, images);
      setNewPost({
        title: '',
        description: '',
        price: '',
        quantity: '',
        unit: 'kg',
        category: '',
        location: '',
        region: ''
      });
      setImages([]);
      setShowCreateForm(false);
      fetchMarketPosts();
      fetchStats();
      setError(null);
    } catch (err) {
      setError('Failed to create post');
      console.error('Error creating post:', err);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    inactivePosts: 0
  });

  const categories = ['crops', 'livestock', 'equipment', 'seeds', 'fertilizers', 'tools'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const statusOptions = ['All', 'Available', 'Unavailable'];

  // Category icons and colors
  const categoryStyles = {
    crops: { icon: '🌾', color: 'green' },
    livestock: { icon: '🐄', color: 'red' },
    equipment: { icon: '🚜', color: 'blue' },
    seeds: { icon: '🌱', color: 'emerald' },
    fertilizers: { icon: '🧪', color: 'yellow' },
    tools: { icon: '🛠️', color: 'purple' }
  };

  useEffect(() => {
    fetchMarketPosts();
    fetchStats();
  }, [selectedCategory, selectedRegion]);

  const fetchMarketPosts = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.market.getPosts(selectedCategory || null, selectedRegion || null);
      setPosts(data.posts || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch market posts');
      console.error('Error fetching market posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await agriConnectAPI.market.getPosts();
      const allPosts = data.posts || [];
      setStats({
        totalPosts: allPosts.length,
        activePosts: allPosts.filter(p => p.is_available).length,
        inactivePosts: allPosts.filter(p => !p.is_available).length
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await agriConnectAPI.market.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
      setError(null);
    } catch (err) {
      setError('Failed to delete post');
      console.error('Error deleting post:', err);
    }
  };

  const togglePostAvailability = async (postId, currentStatus) => {
    try {
      await agriConnectAPI.market.updatePost(postId, { is_available: !currentStatus });
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_available: !currentStatus }
          : post
      ));
      fetchStats(); // Update stats
      setError(null);
    } catch (err) {
      setError('Failed to update post status');
      console.error('Error updating post:', err);
    }
  };

  const filteredPosts = posts.filter(post => {
    // Status filter
    if (filterStatus !== 'All' && post.is_available !== (filterStatus === 'Available')) return false;
    
    // Search term
    if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !post.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const getStatusTag = (isAvailable) => {
    const colors = {
      true: 'bg-green-100 text-green-800',
      false: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[isAvailable.toString()]}`}>
        {isAvailable ? 'Available' : 'Unavailable'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading market posts...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Create Post Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center ${
            showCreateForm 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {showCreateForm ? (
            <>
              <FiXCircle className="mr-2" size={16} />
              Cancel
            </>
          ) : (
            <>
              <FiPlus className="mr-2" size={16} />
              Create Post
            </>
          )}
        </button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-6 flex items-center">
            <FiPlus className="mr-2" />
            Create New Market Post
          </h2>
          <form onSubmit={handleCreatePost} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                placeholder="Enter post title (e.g., Fresh Maize - 100kg)"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={newPost.price}
                onChange={(e) => setNewPost({...newPost, price: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Describe your product in detail..."
                value={newPost.description}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={newPost.quantity}
                onChange={(e) => setNewPost({...newPost, quantity: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                value={newPost.unit}
                onChange={(e) => setNewPost({...newPost, unit: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => {
                  const style = categoryStyles[category] || { icon: '📦', color: 'gray' };
                  return (
                    <option key={category} value={category}>
                      {style.icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
              <select
                value={newPost.region}
                onChange={(e) => setNewPost({...newPost, region: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Region</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                placeholder="Enter specific location (e.g., Nakuru Town)"
                value={newPost.location}
                onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              <div className="flex items-center space-x-4">
                <label className="flex-1">
                  <div className="flex items-center justify-center px-4 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <FiUpload className="mr-2 text-gray-400" size={20} />
                    <span className="text-gray-600">Choose images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </label>
                {images.length > 0 && (
                  <span className="text-sm text-green-600 flex items-center">
                    <FiImage className="mr-1" size={16} />
                    {images.length} image(s) selected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload product images to attract more buyers (optional)</p>
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <button 
                type="submit"
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center transition-colors"
              >
                <FiPlus className="mr-2" size={18} />
                Create Listing
              </button>
            </div>
          </form>
        </section>
      )}
      {/* Header with Stats */}
      <header className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-800">
              <span className="text-3xl">📊</span> Market Management Dashboard
            </h1>
            <p className="text-gray-600">Monitor and manage all marketplace listings</p>
          </div>
          <button 
            onClick={fetchMarketPosts}
            className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center"
          >
            <FiRefreshCw className="mr-1" size={18} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-sm font-medium text-green-800">Total Listings</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalPosts}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Active Listings</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.activePosts}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h3 className="text-sm font-medium text-red-800">Inactive Listings</h3>
            <p className="text-2xl font-bold text-red-600">{stats.inactivePosts}</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <FiXCircle className="text-red-500 mr-2" size={20} />
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <FiXCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-4 flex items-center">
          <FiFilter className="mr-2" />
          Filters & Search
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search posts by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => {
              const style = categoryStyles[category] || { icon: '📦', color: 'gray' };
              return (
                <option key={category} value={category}>
                  {style.icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              );
            })}
          </select>

          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Market Posts List */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-green-700 flex items-center">
            <span className="text-2xl mr-2">📦</span> All Market Listings
          </h2>
          <span className="text-sm text-gray-500 flex items-center">
            {filteredPosts.length} of {posts.length} posts
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No market posts found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPosts.map(post => {
              const categoryStyle = categoryStyles[post.category] || { icon: '📦', color: 'gray' };
              
              return (
                <div key={post.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{post.title}</h3>
                    {getStatusTag(post.is_available)}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-xl font-bold text-blue-600">${post.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm text-gray-700">{post.location}, {post.region}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${categoryStyle.color}-100 text-${categoryStyle.color}-800`}>
                        {categoryStyle.icon} {post.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="text-sm font-medium">{post.quantity} {post.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>Posted by: {post.user?.username || 'Unknown'}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => togglePostAvailability(post.id, post.is_available)}
                      className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                        post.is_available 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {post.is_available ? (
                        <>
                          <FiXCircle className="mr-1" size={14} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="mr-1" size={14} />
                          Activate
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 flex items-center"
                    >
                      <FiTrash2 className="mr-1" size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ManageMarket;