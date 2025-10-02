import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { 
  FiSearch, FiFilter, FiRefreshCw, FiEdit, FiTrash2, 
  FiCheckCircle, FiXCircle, FiPlus, FiUpload, FiImage, 
  FiShoppingCart, FiUsers, FiAlertCircle, FiPackage, 
  FiShoppingBag, FiBarChart2, FiSettings, FiEye,
  FiDollarSign, FiTrendingUp, FiMapPin, FiCalendar,
  FiUser, FiHeart, FiGrid, FiList, FiStar, FiClock,
  FiActivity, FiTarget, FiTrendingDown, FiX,
  FiMail, FiPhone, FiTruck, FiBarChart
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const ManageMarket = () => {
  const [farmerPosts, setFarmerPosts] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [marketNeeds, setMarketNeeds] = useState([]);
  const [interests, setInterests] = useState([]);
  const [showCreateNeedForm, setShowCreateNeedForm] = useState(false);
  const [showEditNeedForm, setShowEditNeedForm] = useState(false);
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postInterests, setPostInterests] = useState([]);
  
  const [newNeed, setNewNeed] = useState({
    title: '', description: '', price: '', quantity: '', 
    unit: 'kg', category: '', location: '', region: '', 
    type: 'need', status: 'active', priority: 'normal'
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({
    totalFarmerPosts: 0, activeFarmerPosts: 0, pendingApprovals: 0,
    totalAdminPosts: 0, activeAdminPosts: 0, totalRevenue: 0,
    pendingDeals: 0, totalNeeds: 0, openNeeds: 0, totalInterests: 0
  });

  const units = ['kg', 'unit', 'bag', 'ton', 'liter', 'dozen'];
  const categories = ['crops', 'livestock', 'equipment', 'seeds', 'fertilizers', 'tools'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const statusOptions = ['All', 'active', 'closed', 'pending'];
  const priorityOptions = ['high', 'normal', 'low'];

  const categoryStyles = {
    crops: { icon: '🌾', color: 'emerald', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-800' },
    livestock: { icon: '🐄', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' },
    equipment: { icon: '🚜', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' },
    seeds: { icon: '🌱', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' },
    fertilizers: { icon: '🧪', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' },
    tools: { icon: '🛠️', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-800' }
  };

  useEffect(() => {
    fetchMarketData();
    fetchStats();
  }, [selectedCategory, selectedRegion, activeTab, sortBy]);

  // Auto-refresh every 30 seconds to sync with user actions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      const postsData = await agriConnectAPI.market.getPosts(
        selectedCategory || null, 
        selectedRegion || null,
        null, null, null, false
      );
      
      const allPosts = postsData.posts || [];
      
      const farmerPosts = allPosts.filter(post => 
        post.user?.user_type === 'farmer' || post.user?.user_type === 'supplier'
      );
      const adminPosts = allPosts.filter(post => 
        post.user?.user_type === 'admin' && post.type === 'product'
      );
      const marketNeeds = allPosts.filter(post => 
        post.user?.user_type === 'admin' && post.type === 'need'
      );

      setFarmerPosts(sortPosts(farmerPosts, sortBy));
      setAdminPosts(sortPosts(adminPosts, sortBy));
      setMarketNeeds(sortPosts(marketNeeds, sortBy));
      
      const allInterests = [];
      for (const post of allPosts) {
        if (post.interests && post.interests.length > 0) {
          allInterests.push(...post.interests);
        }
      }
      setInterests(allInterests);
      
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
      
      const postsData = await agriConnectAPI.market.getPosts();
      const allPosts = postsData.posts || [];
      
      const farmerPosts = allPosts.filter(post => 
        post.user?.user_type === 'farmer' || post.user?.user_type === 'supplier'
      );
      const adminPosts = allPosts.filter(post => 
        post.user?.user_type === 'admin' && post.type === 'product'
      );
      const marketNeeds = allPosts.filter(post => 
        post.user?.user_type === 'admin' && post.type === 'need'
      );
      
      const totalInterests = allPosts.reduce((sum, post) => sum + (post.interest_count || 0), 0);
      
      setStats({
        totalFarmerPosts: farmerPosts.length,
        activeFarmerPosts: farmerPosts.filter(p => p.status === 'active').length,
        pendingApprovals: farmerPosts.filter(p => !p.approved).length,
        totalAdminPosts: adminPosts.length,
        activeAdminPosts: adminPosts.filter(p => p.status === 'active').length,
        totalRevenue: adminPosts.reduce((sum, post) => sum + (parseFloat(post.price) * parseFloat(post.quantity) || 0), 0),
        pendingDeals: marketNeeds.filter(n => n.accepted_by && n.status === 'pending').length,
        totalNeeds: marketNeeds.length,
        openNeeds: marketNeeds.filter(n => n.status === 'active').length,
        totalInterests: totalInterests
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

  const handleCreateNeed = async (e) => {
    e.preventDefault();
    try {
      if (!newNeed.title || !newNeed.price || !newNeed.quantity) {
        toast.error('Please fill in all required fields');
        return;
      }

      await agriConnectAPI.market.createNeed(newNeed);
      toast.success('Market need created successfully!');
      setShowCreateNeedForm(false);
      resetForm();
      fetchMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error creating need:', err);
      toast.error('Failed to create market need');
    }
  };

  const handleUpdateNeed = async (e) => {
    e.preventDefault();
    try {
      if (!editingNeed) return;

      await agriConnectAPI.market.updateNeed(editingNeed.id, newNeed);
      toast.success('Market need updated successfully!');
      setShowEditNeedForm(false);
      resetForm();
      fetchMarketData();
    } catch (err) {
      console.error('Error updating need:', err);
      toast.error('Failed to update market need');
    }
  };

  const handleDeleteNeed = async (needId) => {
    if (!window.confirm('Are you sure you want to delete this market need?')) return;
    
    try {
      await agriConnectAPI.market.deleteNeed(needId);
      toast.success('Market need deleted successfully!');
      fetchMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error deleting need:', err);
      toast.error('Failed to delete market need');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await agriConnectAPI.market.approvePost(postId);
      toast.success('Post approved successfully!');
      fetchMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error approving post:', err);
      toast.error('Failed to approve post');
    }
  };

  const handleRejectPost = async (postId) => {
    if (!window.confirm('Are you sure you want to reject this post?')) return;
    
    try {
      await agriConnectAPI.market.rejectPost(postId);
      toast.success('Post rejected successfully!');
      fetchMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error rejecting post:', err);
      toast.error('Failed to reject post');
    }
  };

  const handleViewPostDetails = async (post) => {
    setSelectedPost(post);
    
    try {
      const interests = await agriConnectAPI.market.getPostInterests(post.id);
      setPostInterests(interests);
    } catch (err) {
      console.error('Error fetching post interests:', err);
      setPostInterests([]);
    }
    
    setShowPostDetailsModal(true);
  };

  const handleViewInterests = async (post) => {
    setSelectedPost(post);
    
    try {
      const interests = await agriConnectAPI.market.getPostInterests(post.id);
      setPostInterests(interests);
      setShowInterestsModal(true);
    } catch (err) {
      console.error('Error fetching interests:', err);
      toast.error('Failed to load interests');
    }
  };

  const handleAcceptInterest = async (interestId) => {
    try {
      await agriConnectAPI.market.acceptInterest(interestId);
      toast.success('Interest accepted successfully!');
      
      await handleViewInterests(selectedPost);
      fetchMarketData();
      fetchStats();
    } catch (err) {
      console.error('Error accepting interest:', err);
      toast.error('Failed to accept interest');
    }
  };

  const resetForm = () => {
    setNewNeed({
      title: '', description: '', price: '', quantity: '', 
      unit: 'kg', category: '', location: '', region: '', 
      type: 'need', status: 'active', priority: 'normal'
    });
    setImages([]);
    setEditingNeed(null);
  };

  const openEditForm = (need) => {
    setEditingNeed(need);
    setNewNeed({
      title: need.title,
      description: need.description,
      price: need.price,
      quantity: need.quantity,
      unit: need.unit,
      category: need.category,
      location: need.location,
      region: need.region,
      type: need.type,
      status: need.status,
      priority: need.priority || 'normal'
    });
    setShowEditNeedForm(true);
  };

  const getFilteredPosts = (posts) => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || post.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading market data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Market Management</h1>
              <p className="text-gray-600 text-lg">Oversee and manage agricultural marketplace activities</p>
            </div>
            <div className="flex gap-4 mt-4 lg:mt-0">
              <motion.button
                onClick={() => setShowCreateNeedForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-5 h-5" />
                Create Market Need
              </motion.button>
              <motion.button
                onClick={() => fetchMarketData()}
                className="bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 shadow-lg border border-gray-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw className="w-5 h-5" />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Farmer Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFarmerPosts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiTarget className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Market Needs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNeeds}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiHeart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total Interests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInterests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FiActivity className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Active Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeFarmerPosts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Est. Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(0)}</p>
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
              { key: 'overview', label: 'Overview', icon: FiBarChart2 },
              { key: 'farmerPosts', label: 'Farmer Posts', icon: FiUsers },
              { key: 'marketNeeds', label: 'Market Needs', icon: FiTarget },
              { key: 'interests', label: 'Interest Analytics', icon: FiTrendingUp }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
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
                placeholder="Search posts, needs, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                {statusOptions.slice(1).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
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
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OverviewTab 
                stats={stats}
                farmerPosts={getFilteredPosts(farmerPosts).slice(0, 6)}
                marketNeeds={getFilteredPosts(marketNeeds).slice(0, 6)}
                onApprovePost={handleApprovePost}
                onRejectPost={handleRejectPost}
                onViewDetails={handleViewPostDetails}
                categoryStyles={categoryStyles}
                viewMode={viewMode}
              />
            </motion.div>
          )}

          {activeTab === 'farmerPosts' && (
            <motion.div
              key="farmerPosts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {getFilteredPosts(farmerPosts).length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {getFilteredPosts(farmerPosts).map((post) => (
                    <FarmerPostCard 
                      key={post.id} 
                      post={post} 
                      onApprove={handleApprovePost}
                      onReject={handleRejectPost}
                      onViewDetails={handleViewPostDetails}
                      onViewInterests={handleViewInterests}
                      viewMode={viewMode}
                      categoryStyles={categoryStyles}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FiUsers}
                  title="No farmer posts found"
                  description="No farmer posts match your current filters"
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
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FiTarget className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-900">Market Needs</h2>
                    <p className="text-amber-700">Admin-created demands that farmers can fulfill</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                    🎯 {getFilteredPosts(marketNeeds).length} Active Needs
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    ✅ Auto-approved
                  </span>
                </div>
              </div>

              {getFilteredPosts(marketNeeds).length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {getFilteredPosts(marketNeeds).map((need) => (
                    <MarketNeedCard 
                      key={need.id} 
                      need={need} 
                      onEdit={openEditForm}
                      onDelete={handleDeleteNeed}
                      onViewDetails={handleViewPostDetails}
                      onViewInterests={handleViewInterests}
                      viewMode={viewMode}
                      categoryStyles={categoryStyles}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FiTarget}
                  title="No market needs"
                  description="Create market needs to connect with suppliers"
                  actionText="Create Market Need"
                  onAction={() => setShowCreateNeedForm(true)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <InterestAnalytics 
                interests={interests}
                posts={[...farmerPosts, ...adminPosts, ...marketNeeds]}
                categoryStyles={categoryStyles}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <NeedFormModal
          isOpen={showCreateNeedForm || showEditNeedForm}
          onClose={() => {
            setShowCreateNeedForm(false);
            setShowEditNeedForm(false);
            resetForm();
          }}
          onSubmit={showEditNeedForm ? handleUpdateNeed : handleCreateNeed}
          need={newNeed}
          setNeed={setNewNeed}
          images={images}
          setImages={setImages}
          categories={categories}
          units={units}
          regions={regions}
          priorityOptions={priorityOptions}
          isEditing={showEditNeedForm}
        />

        <PostDetailsModal
          isOpen={showPostDetailsModal}
          onClose={() => setShowPostDetailsModal(false)}
          post={selectedPost}
          interests={postInterests}
          onApprove={handleApprovePost}
          onReject={handleRejectPost}
          onAcceptInterest={handleAcceptInterest}
          categoryStyles={categoryStyles}
        />

        <InterestsModal
          isOpen={showInterestsModal}
          onClose={() => setShowInterestsModal(false)}
          post={selectedPost}
          interests={postInterests}
          onAcceptInterest={handleAcceptInterest}
        />
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, farmerPosts, marketNeeds, onApprovePost, onRejectPost, onViewDetails, categoryStyles, viewMode }) => (
  <div className="space-y-8">
    {/* Recent Activity Summary */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Farmer Posts */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Farmer Posts</h3>
          <span className="text-sm text-gray-500">{farmerPosts.length} posts</span>
        </div>
        <div className="space-y-4">
          {farmerPosts.slice(0, 3).map((post) => (
            <div key={post.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{post.title}</h4>
                <p className="text-sm text-gray-500">{post.user?.username} • ${post.price}</p>
              </div>
              <div className="flex gap-2">
                {!post.approved && (
                  <>
                    <button
                      onClick={() => onApprovePost(post.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRejectPost(post.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiXCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onViewDetails(post)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Market Needs */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Active Market Needs</h3>
          <span className="text-sm text-gray-500">{marketNeeds.length} needs</span>
        </div>
        <div className="space-y-4">
          {marketNeeds.slice(0, 3).map((need) => (
            <div key={need.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{need.title}</h4>
                <p className="text-sm text-gray-500">${need.price} • {need.quantity} {need.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{need.interest_count || 0} interests</span>
                <button
                  onClick={() => onViewDetails(need)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Quick Stats Charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4">Approval Status</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Approved</span>
            <span className="font-medium">{stats.activeFarmerPosts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending</span>
            <span className="font-medium text-yellow-600">{stats.pendingApprovals}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4">Market Activity</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Interests</span>
            <span className="font-medium">{stats.totalInterests}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Active Needs</span>
            <span className="font-medium text-blue-600">{stats.openNeeds}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4">Revenue Estimate</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Value</span>
            <span className="font-medium text-green-600">${stats.totalRevenue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Avg per Post</span>
            <span className="font-medium">
              ${stats.totalFarmerPosts > 0 ? (stats.totalRevenue / stats.totalFarmerPosts).toFixed(0) : '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Farmer Post Card Component
const FarmerPostCard = ({ post, onApprove, onReject, onViewDetails, onViewInterests, viewMode, categoryStyles }) => {
  const style = categoryStyles[post.category] || categoryStyles.crops;
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 h-32' : 'h-48'}`}>
        {post.images && post.images.length > 0 ? (
          <img
            src={`http://localhost:5000${post.images[0].image_url}`}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${style.bgColor} flex items-center justify-center`}>
            <span className="text-4xl">{style.icon}</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            post.approved 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {post.approved ? 'Approved' : 'Pending'}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor}`}>
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{post.title}</h3>
          <div className="flex items-center gap-1 text-yellow-500">
            <FiStar className="w-4 h-4" />
            <span className="text-sm font-medium">{post.quality_grade || 'N/A'}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>

        {/* Post Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiDollarSign className="w-4 h-4" />
            <span>${post.price}/{post.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiPackage className="w-4 h-4" />
            <span>{post.quantity} {post.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin className="w-4 h-4" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUser className="w-4 h-4" />
            <span>{post.user?.username}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FiEye className="w-4 h-4" />
            <span>{post.view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <FiHeart className="w-4 h-4" />
            <span>{post.interest_count || 0} interests</span>
          </div>
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!post.approved && (
            <>
              <motion.button
                onClick={() => onApprove(post.id)}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiCheckCircle className="w-4 h-4" />
                Approve
              </motion.button>
              <motion.button
                onClick={() => onReject(post.id)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiXCircle className="w-4 h-4" />
                Reject
              </motion.button>
            </>
          )}
          <motion.button
            onClick={() => onViewDetails(post)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEye className="w-4 h-4" />
            Details
          </motion.button>
          {(post.interest_count || 0) > 0 && (
            <motion.button
              onClick={() => onViewInterests(post)}
              className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiHeart className="w-4 h-4" />
              {post.interest_count}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Market Need Card Component
const MarketNeedCard = ({ need, onEdit, onDelete, onViewDetails, onViewInterests, viewMode, categoryStyles }) => {
  const style = categoryStyles[need.category] || categoryStyles.crops;
  
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} ${style.bgColor} flex items-center justify-center`}>
        <span className="text-6xl">{style.icon}</span>
        
        {/* Priority Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            need.priority === 'high' 
              ? 'bg-red-100 text-red-800' 
              : need.priority === 'normal'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {need.priority?.toUpperCase() || 'NORMAL'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            need.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : need.status === 'closed'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {need.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{need.title}</h3>
          <div className="flex items-center gap-1 text-blue-500">
            <FiPackage className="w-4 h-4" />
            <span className="text-sm font-medium">Need</span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{need.description}</p>

        {/* Need Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiDollarSign className="w-4 h-4" />
            <span>${need.price}/{need.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiPackage className="w-4 h-4" />
            <span>{need.quantity} {need.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin className="w-4 h-4" />
            <span>{need.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4" />
            <span>{new Date(need.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FiEye className="w-4 h-4" />
            <span>{need.view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <FiHeart className="w-4 h-4" />
            <span>{need.interest_count || 0} interests</span>
          </div>
          {need.accepted_by && (
            <div className="flex items-center gap-1 text-green-600">
              <FiCheckCircle className="w-4 h-4" />
              <span>Accepted</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => onEdit(need)}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEdit className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            onClick={() => onDelete(need.id)}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onViewDetails(need)}
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEye className="w-4 h-4" />
            Details
          </motion.button>
          {(need.interest_count || 0) > 0 && (
            <motion.button
              onClick={() => onViewInterests(need)}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiHeart className="w-4 h-4" />
              {need.interest_count}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Interest Analytics Component
const InterestAnalytics = ({ interests, posts, categoryStyles }) => {
  // Calculate analytics
  const totalInterests = interests.length;
  const uniqueUsers = new Set(interests.map(i => i.user_id)).size;
  const avgInterestsPerPost = posts.length > 0 ? (totalInterests / posts.length).toFixed(1) : 0;
  
  // Group by category
  const interestsByCategory = interests.reduce((acc, interest) => {
    const post = posts.find(p => p.id === interest.post_id);
    if (post && post.category) {
      acc[post.category] = (acc[post.category] || 0) + 1;
    }
    return acc;
  }, {});

  // Group by month
  const interestsByMonth = interests.reduce((acc, interest) => {
    const month = new Date(interest.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  // Most interested posts
  const postInterestCounts = posts.map(post => ({
    ...post,
    interestCount: interests.filter(i => i.post_id === post.id).length
  })).sort((a, b) => b.interestCount - a.interestCount).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiHeart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Interests</p>
              <p className="text-2xl font-bold text-gray-900">{totalInterests}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <FiUser className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Avg per Post</p>
              <p className="text-2xl font-bold text-gray-900">{avgInterestsPerPost}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <FiStar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {posts.length > 0 ? ((totalInterests / posts.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interests by Category */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Interests by Category</h3>
          <div className="space-y-4">
            {Object.entries(interestsByCategory).map(([category, count]) => {
              const style = categoryStyles[category] || categoryStyles.crops;
              const percentage = totalInterests > 0 ? (count / totalInterests * 100).toFixed(1) : 0;
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <span className="font-medium text-gray-900 capitalize">{category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${style.color}-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Popular Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Most Popular Posts</h3>
          <div className="space-y-4">
            {postInterestCounts.map((post, index) => {
              const style = categoryStyles[post.category] || categoryStyles.crops;
              
              return (
                <div key={post.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-xl">{style.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{post.title}</h4>
                    <p className="text-sm text-gray-500">{post.user?.username} • ${post.price}</p>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <FiHeart className="w-4 h-4" />
                    <span className="font-medium">{post.interestCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interests Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Interest Timeline</h3>
        <div className="space-y-3">
          {Object.entries(interestsByMonth).map(([month, count]) => {
            const maxCount = Math.max(...Object.values(interestsByMonth));
            const percentage = maxCount > 0 ? (count / maxCount * 100) : 0;
            
            return (
              <div key={month} className="flex items-center justify-between">
                <span className="font-medium text-gray-900 w-24">{month}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div 
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    ></motion.div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <motion.div 
    className="text-center py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {actionText && onAction && (
      <motion.button
        onClick={onAction}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {actionText}
      </motion.button>
    )}
  </motion.div>
);

// Need Form Modal Component
const NeedFormModal = ({ 
  isOpen, onClose, onSubmit, need, setNeed, images, setImages,
  categories, units, regions, priorityOptions, isEditing 
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    setImages(prev => [...prev, ...fileArray]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Market Need' : 'Create Market Need'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={need.title}
                  onChange={(e) => setNeed({...need, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter need title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={need.category}
                  onChange={(e) => setNeed({...need, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={need.description}
                onChange={(e) => setNeed({...need, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what you need"
                required
              />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    value={need.price}
                    onChange={(e) => setNeed({...need, price: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={need.quantity}
                  onChange={(e) => setNeed({...need, quantity: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={need.unit}
                  onChange={(e) => setNeed({...need, unit: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={need.location}
                    onChange={(e) => setNeed({...need, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={need.region}
                  onChange={(e) => setNeed({...need, region: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={need.priority}
                  onChange={(e) => setNeed({...need, priority: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Status
                </label>
                <select
                  value={need.status}
                  onChange={(e) => setNeed({...need, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop images here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                {isEditing ? 'Update Need' : 'Create Need'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Post Details Modal Component
const PostDetailsModal = ({ 
  isOpen, onClose, post, interests, onApprove, onReject, 
  onAcceptInterest, categoryStyles 
}) => {
  if (!isOpen || !post) return null;

  const style = categoryStyles[post.category] || categoryStyles.crops;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{style.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
                <p className="text-gray-600">
                  Posted by {post.user?.username} • {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  post.approved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.approved ? 'Approved' : 'Pending Approval'}
                </span>
                
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${style.bgColor} ${style.textColor}`}>
                  {post.category?.charAt(0).toUpperCase() + post.category?.slice(1)}
                </span>

                {post.type === 'need' && post.priority && (
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    post.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : post.priority === 'normal'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {post.priority?.toUpperCase()} Priority
                  </span>
                )}
              </div>

              {!post.approved && (
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onApprove(post.id)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Approve
                  </motion.button>
                  <motion.button
                    onClick={() => onReject(post.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiXCircle className="w-4 h-4" />
                    Reject
                  </motion.button>
                </div>
              )}
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:5000${image.image_url}`}
                      alt={`${post.title} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">${post.price}/{post.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPackage className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{post.quantity} {post.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{post.location || 'Not specified'}</span>
                  </div>
                  {post.region && (
                    <div className="flex items-center gap-3">
                      <FiMapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">{post.region}</span>
                    </div>
                  )}
                  {post.harvest_date && (
                    <div className="flex items-center gap-3">
                      <FiCalendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Harvest Date:</span>
                      <span className="font-medium">{new Date(post.harvest_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {post.expiry_date && (
                    <div className="flex items-center gap-3">
                      <FiClock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium">{new Date(post.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {post.quality_grade && (
                    <div className="flex items-center gap-3">
                      <FiStar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Quality Grade:</span>
                      <span className="font-medium">{post.quality_grade}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Username:</span>
                    <span className="font-medium">{post.user?.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{post.user?.email}</span>
                  </div>
                  {post.user?.profile?.phone && (
                    <div className="flex items-center gap-3">
                      <FiPhone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{post.user.profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <FiEye className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{post.view_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiHeart className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Interests:</span>
                    <span className="font-medium">{post.interest_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">{post.description}</p>
            </div>

            {/* Interests */}
            {interests && interests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Interested Users ({interests.length})
                </h3>
                <div className="space-y-3">
                  {interests.map((interest) => (
                    <div key={interest.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{interest.user?.username}</h4>
                          <p className="text-sm text-gray-500">
                            Interested on {new Date(interest.created_at).toLocaleDateString()}
                          </p>
                          {interest.message && (
                            <p className="text-sm text-gray-600 mt-1">"{interest.message}"</p>
                          )}
                        </div>
                      </div>
                      
                      {!interest.accepted && post.type === 'need' && (
                        <motion.button
                          onClick={() => onAcceptInterest(interest.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          Accept
                        </motion.button>
                      )}
                      
                      {interest.accepted && (
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                          ✓ Accepted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Interests Modal Component
const InterestsModal = ({ isOpen, onClose, post, interests, onAcceptInterest }) => {
  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Interested Users</h2>
              <p className="text-gray-600">{post.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Interests List */}
          <div className="p-6">
            {interests && interests.length > 0 ? (
              <div className="space-y-4">
                {interests.map((interest) => (
                  <motion.div 
                    key={interest.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{interest.user?.username}</h4>
                        <p className="text-sm text-gray-500">
                          {interest.user?.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Interested on {new Date(interest.created_at).toLocaleDateString()}
                        </p>
                        {interest.message && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{interest.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {interest.accepted ? (
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                          <FiCheckCircle className="w-4 h-4" />
                          Accepted
                        </span>
                      ) : post.type === 'need' ? (
                        <motion.button
                          onClick={() => onAcceptInterest(interest.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          Accept
                        </motion.button>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
                          Interested
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interests yet</h3>
                <p className="text-gray-600">This post hasn't received any interest from users.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManageMarket;