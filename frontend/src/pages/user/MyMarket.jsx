import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { 
  FiSearch, FiPlus, FiEdit, FiTrash2, FiCheckCircle, 
  FiXCircle, FiUpload, FiImage, FiShoppingCart, 
  FiAlertCircle, FiUser, FiDollarSign, FiTrendingUp,
  FiRefreshCw, FiPackage, FiMapPin, FiCalendar,
  FiEye, FiHeart, FiFilter, FiGrid, FiList,
  FiStar, FiClock, FiTruck, FiBarChart
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const MyMarket = () => {
  const [myPosts, setMyPosts] = useState([]);
  const [marketNeeds, setMarketNeeds] = useState([]);
  const [myInterests, setMyInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [activeTab, setActiveTab] = useState('myPosts');
  const [stats, setStats] = useState({
    totalPosts: 0, activePosts: 0, totalViews: 0, totalInterests: 0
  });

  const [newPost, setNewPost] = useState({
    title: '', description: '', price: '', quantity: '', 
    unit: 'kg', category: '', location: '', region: '',
    type: 'product', priority: 'normal', quality_grade: '',
    harvest_date: '', expiry_date: ''
  });

  const [interestData, setInterestData] = useState({
    message: '', offer_price: '', offer_quantity: ''
  });

  const [images, setImages] = useState([]);

  const categories = ['crops', 'livestock', 'equipment', 'seeds', 'fertilizers', 'tools'];
  const units = ['kg', 'unit', 'bag', 'ton', 'liter', 'dozen'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const statusOptions = ['All', 'active', 'closed', 'pending'];
  const priorityOptions = ['high', 'normal', 'low'];
  const qualityGrades = ['A', 'B', 'C'];

  const categoryStyles = {
    crops: { icon: '🌾', color: 'emerald', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-800' },
    livestock: { icon: '🐄', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' },
    equipment: { icon: '🚜', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' },
    seeds: { icon: '🌱', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' },
    fertilizers: { icon: '🧪', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' },
    tools: { icon: '🛠️', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-800' }
  };

  useEffect(() => {
    fetchMyMarketData();
    fetchStats();
  }, [filterCategory, filterRegion, sortBy]);

  // Auto-refresh every 30 seconds to sync with admin actions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMyMarketData();
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchMyMarketData = async () => {
    try {
      setLoading(true);
      const userId = parseInt(agriConnectAPI.getUserId());
      
      // Store previous posts for comparison
      const previousPosts = myPosts;
      
      // Fetch user's own posts
      const postsData = await agriConnectAPI.market.getPosts(
        filterCategory !== 'All' ? filterCategory : null,
        filterRegion !== 'All' ? filterRegion : null,
        null, null, 'farmer', false
      );
      
      const userPosts = postsData.posts.filter(post => post.user_id === userId);
      
      // Check for approval status changes and notify user
      if (previousPosts.length > 0) {
        userPosts.forEach(currentPost => {
          const previousPost = previousPosts.find(p => p.id === currentPost.id);
          if (previousPost && !previousPost.approved && currentPost.approved) {
            toast.success(`Your post "${currentPost.title}" has been approved by admin!`);
          } else if (previousPost && previousPost.status !== 'rejected' && currentPost.status === 'rejected') {
            toast.error(`Your post "${currentPost.title}" has been rejected by admin.`);
          }
        });
      }
      
      // Apply sorting
      const sortedPosts = sortPosts(userPosts, sortBy);
      setMyPosts(sortedPosts);
      
      // Fetch market needs (admin posts of type 'need')
      const needsData = await agriConnectAPI.market.getPosts(
        null, null, 'need', 'active', 'admin', true
      );
      setMarketNeeds(needsData.posts);
      
      // Fetch user's interests
      const allPosts = await agriConnectAPI.market.getPosts();
      const userInterests = allPosts.posts
        .filter(post => post.interests && post.interests.some(interest => interest.user_id === userId))
        .map(post => ({
          ...post,
          userInterest: post.interests.find(interest => interest.user_id === userId)
        }));
      setMyInterests(userInterests);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error fetching market data:', err);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await agriConnectAPI.market.getStats();
      const userId = parseInt(agriConnectAPI.getUserId());
      
      // Calculate user-specific stats
      const postsData = await agriConnectAPI.market.getPosts();
      const userPosts = postsData.posts.filter(post => post.user_id === userId);
      
      const totalViews = userPosts.reduce((sum, post) => sum + (post.view_count || 0), 0);
      const totalInterests = userPosts.reduce((sum, post) => sum + (post.interest_count || 0), 0);
      
      setStats({
        totalPosts: statsData.user_posts || userPosts.length,
        activePosts: statsData.active_user_posts || userPosts.filter(p => p.status === 'active').length,
        totalViews,
        totalInterests
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const sortPosts = (posts, criteria) => {
    const sorted = [...posts];
    switch (criteria) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'price_low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      case 'interest':
        return sorted.sort((a, b) => (b.interest_count || 0) - (a.interest_count || 0));
      default:
        return sorted;
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      if (!newPost.title || !newPost.price || !newPost.quantity) {
        toast.error('Please fill in all required fields');
        return;
      }

      await agriConnectAPI.market.createPost(newPost, images);
      toast.success('Post created successfully! Awaiting admin approval.');
      setShowCreateForm(false);
      resetForm();
      fetchMyMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Failed to create post');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      if (!editingPost) return;

      await agriConnectAPI.market.updatePost(editingPost.id, newPost);
      toast.success('Post updated successfully!');
      setShowEditForm(false);
      resetForm();
      fetchMyMarketData();
    } catch (err) {
      console.error('Error updating post:', err);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await agriConnectAPI.market.deletePost(postId);
      toast.success('Post deleted successfully!');
      fetchMyMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    try {
      if (!selectedPost) return;

      const userId = parseInt(agriConnectAPI.getUserId());
      
      // Prevent users from expressing interest in their own posts
      if (selectedPost.user_id === userId) {
        toast.error('You cannot express interest in your own post');
        setShowInterestModal(false);
        return;
      }
      
      // Check if post is active
      if (selectedPost.status !== 'active') {
        toast.error('This post is no longer available for interest');
        setShowInterestModal(false);
        return;
      }

      await agriConnectAPI.market.expressInterest(selectedPost.id, interestData);
      toast.success('Interest expressed successfully!');
      setShowInterestModal(false);
      setInterestData({ message: '', offer_price: '', offer_quantity: '' });
      fetchMyMarketData();
    } catch (err) {
      console.error('Error expressing interest:', err);
      const errorMessage = err.message || 'Failed to express interest';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setNewPost({
      title: '', description: '', price: '', quantity: '', 
      unit: 'kg', category: '', location: '', region: '',
      type: 'product', priority: 'normal', quality_grade: '',
      harvest_date: '', expiry_date: ''
    });
    setImages([]);
    setEditingPost(null);
  };

  const openEditForm = (post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      description: post.description,
      price: post.price,
      quantity: post.quantity,
      unit: post.unit,
      category: post.category,
      location: post.location,
      region: post.region,
      type: post.type,
      priority: post.priority || 'normal',
      quality_grade: post.quality_grade || '',
      harvest_date: post.harvest_date || '',
      expiry_date: post.expiry_date || ''
    });
    setShowEditForm(true);
  };

  const canExpressInterest = (post) => {
    const userId = parseInt(agriConnectAPI.getUserId());
    
    // User cannot express interest in their own posts
    if (post.user_id === userId) return false;
    
    // Post must be active
    if (post.status !== 'active') return false;
    
    // User must not have already expressed interest
    if (post.interests && post.interests.some(interest => interest.user_id === userId)) return false;
    
    return true;
  };

  const openInterestModal = (post) => {
    if (!canExpressInterest(post)) {
      if (post.user_id === parseInt(agriConnectAPI.getUserId())) {
        toast.error('You cannot express interest in your own post');
      } else if (post.status !== 'active') {
        toast.error('This post is no longer available');
      } else {
        toast.error('You have already expressed interest in this post');
      }
      return;
    }
    
    setSelectedPost(post);
    setShowInterestModal(true);
  };

  const filteredPosts = myPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredNeeds = marketNeeds.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
          <p className="text-gray-600 text-lg">Loading your market data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Market</h1>
              <p className="text-gray-600 text-lg">Manage your products and explore market opportunities</p>
            </div>
            <motion.button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 lg:mt-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="w-5 h-5" />
              Create New Post
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Active Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePosts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiEye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiHeart className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total Interests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInterests}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-4 bg-white rounded-2xl p-2 shadow-lg">
            {[
              { key: 'myPosts', label: 'My Posts', icon: FiPackage },
              { key: 'marketNeeds', label: 'Market Needs', icon: FiShoppingCart },
              { key: 'myInterests', label: 'My Interests', icon: FiHeart }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div 
          className="bg-white rounded-2xl p-6 mb-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                {statusOptions.slice(1).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="interest">Most Interest</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'myPosts' && (
            <motion.div
              key="myPosts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredPosts.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onEdit={openEditForm}
                      onDelete={handleDeletePost}
                      viewMode={viewMode}
                      categoryStyles={categoryStyles}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FiPackage}
                  title="No posts yet"
                  description="Create your first market post to start selling your products"
                  actionText="Create Post"
                  onAction={() => setShowCreateForm(true)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'marketNeeds' && (
            <motion.div
              key="marketNeeds"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredNeeds.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredNeeds.map((need) => (
                    <NeedCard 
                      key={need.id} 
                      need={need} 
                      onExpressInterest={openInterestModal}
                      viewMode={viewMode}
                      categoryStyles={categoryStyles}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FiShoppingCart}
                  title="No market needs available"
                  description="Check back later for new market opportunities"
                />
              )}
            </motion.div>
          )}

          {activeTab === 'myInterests' && (
            <motion.div
              key="myInterests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {myInterests.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {myInterests.map((interest) => (
                    <InterestCard 
                      key={interest.id} 
                      interest={interest} 
                      viewMode={viewMode}
                      categoryStyles={categoryStyles}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FiHeart}
                  title="No interests yet"
                  description="Express interest in market needs to see them here"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Post Modal */}
        <PostFormModal
          isOpen={showCreateForm || showEditForm}
          onClose={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            resetForm();
          }}
          onSubmit={showEditForm ? handleUpdatePost : handleCreatePost}
          post={newPost}
          setPost={setNewPost}
          images={images}
          setImages={setImages}
          categories={categories}
          units={units}
          regions={regions}
          priorityOptions={priorityOptions}
          qualityGrades={qualityGrades}
          isEditing={showEditForm}
        />

        {/* Interest Modal */}
        <InterestModal
          isOpen={showInterestModal}
          onClose={() => setShowInterestModal(false)}
          onSubmit={handleExpressInterest}
          post={selectedPost}
          interestData={interestData}
          setInterestData={setInterestData}
        />
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, onEdit, onDelete, viewMode, categoryStyles }) => {
  const categoryStyle = categoryStyles[post.category] || categoryStyles.crops;
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Image Section */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
        {post.images && post.images.length > 0 ? (
          <img
            src={`http://localhost:5000/static/uploads/${post.images[0]}`}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <FiImage className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            post.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : post.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {post.status?.charAt(0).toUpperCase() + post.status?.slice(1)}
          </span>
        </div>

        {/* Approval Status */}
        <div className="absolute top-3 right-3">
          {post.approved ? (
            <div className="bg-green-100 text-green-800 p-1 rounded-full">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
              <FiClock className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`${categoryStyle.bgColor} ${categoryStyle.textColor} px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
            <span>{categoryStyle.icon}</span>
            {post.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
          <div className="flex gap-2">
            <motion.button
              onClick={() => onEdit(post)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiEdit className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => onDelete(post.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiTrash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              ${post.price?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {post.quantity} {post.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <FiMapPin className="w-4 h-4" />
            {post.location}, {post.region}
          </div>
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FiEye className="w-4 h-4" />
              {post.view_count || 0} views
            </div>
            <div className="flex items-center gap-1">
              <FiHeart className="w-4 h-4" />
              {post.interest_count || 0} interests
            </div>
          </div>
          
          {post.quality_grade && (
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-500" />
              Grade {post.quality_grade}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Need Card Component
const NeedCard = ({ need, onExpressInterest, viewMode, categoryStyles }) => {
  const categoryStyle = categoryStyles[need.category] || categoryStyles.crops;
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Image Section */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
        {need.images && need.images.length > 0 ? (
          <img
            src={`http://localhost:5000/static/uploads/${need.images[0]}`}
            alt={need.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <FiShoppingCart className="w-12 h-12 text-blue-400" />
          </div>
        )}
        
        {/* Priority Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            need.priority === 'high' 
              ? 'bg-red-100 text-red-800' 
              : need.priority === 'low'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {need.priority?.charAt(0).toUpperCase() + need.priority?.slice(1)} Priority
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`${categoryStyle.bgColor} ${categoryStyle.textColor} px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
            <span>{categoryStyle.icon}</span>
            {need.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{need.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{need.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              ${need.price?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {need.quantity} {need.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <FiMapPin className="w-4 h-4" />
            {need.location}, {need.region}
          </div>
          <div className="flex items-center gap-1">
            <FiUser className="w-4 h-4" />
            Admin Request
          </div>
        </div>

        <motion.button
          onClick={() => onExpressInterest(need)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiHeart className="w-4 h-4" />
          Express Interest
        </motion.button>
      </div>
    </motion.div>
  );
};

// Interest Card Component
const InterestCard = ({ interest, viewMode, categoryStyles }) => {
  const categoryStyle = categoryStyles[interest.category] || categoryStyles.crops;
  const userInterest = interest.userInterest;
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Image Section */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
        {interest.images && interest.images.length > 0 ? (
          <img
            src={`http://localhost:5000/static/uploads/${interest.images[0]}`}
            alt={interest.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
            <FiHeart className="w-12 h-12 text-purple-400" />
          </div>
        )}
        
        {/* Interest Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            userInterest?.status === 'accepted' 
              ? 'bg-green-100 text-green-800' 
              : userInterest?.status === 'declined'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {userInterest?.status?.charAt(0).toUpperCase() + userInterest?.status?.slice(1)}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`${categoryStyle.bgColor} ${categoryStyle.textColor} px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
            <span>{categoryStyle.icon}</span>
            {interest.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{interest.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{interest.description}</p>

        {userInterest?.message && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-1">Your message:</p>
            <p className="text-gray-800">{userInterest.message}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              ${interest.price?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {interest.quantity} {interest.unit}
            </span>
          </div>
        </div>

        {userInterest?.offer_price && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-600 mb-1">Your offer:</p>
            <div className="flex justify-between text-sm">
              <span>Price: ${userInterest.offer_price}</span>
              {userInterest.offer_quantity && (
                <span>Quantity: {userInterest.offer_quantity}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            {new Date(userInterest.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <FiUser className="w-4 h-4" />
            {interest.user?.username}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <motion.div
    className="text-center py-12"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    {actionText && onAction && (
      <motion.button
        onClick={onAction}
        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {actionText}
      </motion.button>
    )}
  </motion.div>
);

// Post Form Modal Component
const PostFormModal = ({ 
  isOpen, onClose, onSubmit, post, setPost, images, setImages, 
  categories, units, regions, priorityOptions, qualityGrades, isEditing 
}) => {
  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Post' : 'Create New Post'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiXCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={post.category}
                onChange={(e) => setPost({ ...post, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                value={post.price}
                onChange={(e) => setPost({ ...post, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={post.quantity}
                  onChange={(e) => setPost({ ...post, quantity: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <select
                  value={post.unit}
                  onChange={(e) => setPost({ ...post, unit: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={post.location}
                onChange={(e) => setPost({ ...post, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                value={post.region}
                onChange={(e) => setPost({ ...post, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Region</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={post.priority}
                onChange={(e) => setPost({ ...post, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Grade
              </label>
              <select
                value={post.quality_grade}
                onChange={(e) => setPost({ ...post, quality_grade: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Grade</option>
                {qualityGrades.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harvest Date
              </label>
              <input
                type="date"
                value={post.harvest_date}
                onChange={(e) => setPost({ ...post, harvest_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={post.expiry_date}
                onChange={(e) => setPost({ ...post, expiry_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={post.description}
              onChange={(e) => setPost({ ...post, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click to upload images</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {images.length} file(s) selected
                  </p>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isEditing ? 'Update Post' : 'Create Post'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Interest Modal Component
const InterestModal = ({ isOpen, onClose, onSubmit, post, interestData, setInterestData }) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-2xl w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Express Interest</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiXCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-600 mb-2">{post.description}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>${post.price} per {post.unit}</span>
              <span>{post.quantity} {post.unit} available</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={interestData.message}
                onChange={(e) => setInterestData({ ...interestData, message: e.target.value })}
                rows={3}
                placeholder="Tell the seller why you're interested..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Offer Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestData.offer_price}
                  onChange={(e) => setInterestData({ ...interestData, offer_price: e.target.value })}
                  placeholder={`Original: $${post.price}`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Needed
                </label>
                <input
                  type="number"
                  value={interestData.offer_quantity}
                  onChange={(e) => setInterestData({ ...interestData, offer_quantity: e.target.value })}
                  placeholder={`Max: ${post.quantity} ${post.unit}`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Express Interest
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default MyMarket;