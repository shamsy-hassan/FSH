import React, { useState, useEffect } from 'react';
import { agriConnectAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ManageMarket = () => {
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [regions, setRegions] = useState([]);
  const [existingInterests, setExistingInterests] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    activeNotifications: 0
  });

  const [notificationForm, setNotificationForm] = useState({
    type: 'market_gap',
    region: '',
    productNeeded: '',
    quantity: '',
    priceRange: '',
    exactLocation: '',
    urgency: 'medium',
    expiryDate: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    updateStats();
  }, [products, notifications]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, notificationsResponse, regionsResponse, interestsResponse] = await Promise.all([
        agriConnectAPI.market.getPosts(),
        agriConnectAPI.market.getMarketNotifications(),
        agriConnectAPI.agroclimate.getRegions(),
        agriConnectAPI.market.getMyInterests()
      ]);
      
      if (productsResponse.success) {
        setProducts(productsResponse.posts || []);
      }

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.notifications || []);
      }

      if (regionsResponse.success) {
        setRegions(regionsResponse.regions.map(region => region.name));
      }

      if (interestsResponse.success) {
        // Create a Set of post IDs where the admin has already expressed interest
        const postIds = new Set(
          interestsResponse.interests
            .filter(interest => interest.status === 'pending')
            .map(interest => interest.market_post_id)
        );
        setExistingInterests(postIds);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const totalProducts = products.length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const approvedProducts = products.filter(p => p.status === 'approved' || p.approved).length;
    const activeNotifications = notifications.filter(n => n.status === 'active').length;

    setStats({
      totalProducts,
      pendingProducts,
      approvedProducts,
      activeNotifications
    });
  };

  const handleRequestProduct = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Check if this is the admin's own product
      const currentUser = JSON.parse(localStorage.getItem('agriConnectUser') || '{}');
      if (product.user_id === currentUser.id) {
        toast.error('Cannot send request for your own product');
        return;
      }

      const requestData = {
        message: `Admin is interested in this product: ${product.title}`,
        offer_quantity: product.quantity
      };
      
      console.log('Sending interest request for product:', product);
      console.log('Request data:', requestData);
      
      const response = await agriConnectAPI.market.expressInterest(productId, requestData);

      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'requested', adminRequested: true } : p
        ));
        
        // Add to existing interests set
        setExistingInterests(prev => new Set([...prev, productId]));
        
        toast.success(`Request sent for ${product.title}. User has been notified.`);
      } else {
        toast.error('Failed to send request');
      }
    } catch (error) {
      console.error('Error requesting product:', error);
      if (error.message === 'Interest already expressed') {
        toast.info('You have already expressed interest in this product');
      } else {
        toast.error('Failed to send request');
      }
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const response = await agriConnectAPI.admin.approveMarketPost(productId);
      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'approved', approved: true } : p
        ));
        toast.success('Product approved successfully');
      } else {
        toast.error('Failed to approve product');
      }
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      const response = await agriConnectAPI.admin.rejectMarketPost(productId);
      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'rejected' } : p
        ));
        toast.success('Product rejected');
      } else {
        toast.error('Failed to reject product');
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const handleSendNotification = async () => {
    try {
      if (!notificationForm.region || !notificationForm.productNeeded) {
        toast.error('Please fill in required fields');
        return;
      }

      const response = await agriConnectAPI.market.sendMarketNotification(notificationForm);
      if (response.success) {
        setNotifications([...notifications, response.notification]);
        setShowNotificationForm(false);
        setNotificationForm({
          type: 'market_gap',
          region: '',
          productNeeded: '',
          quantity: '',
          priceRange: '',
          exactLocation: '',
          urgency: 'medium',
          expiryDate: ''
        });
        toast.success('Market notification sent successfully');
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleExpireNotification = async (notificationId) => {
    try {
      const response = await agriConnectAPI.market.expireMarketNotification(notificationId);
      if (response.success) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, status: 'expired' } : n
        ));
        toast.success('Notification expired successfully');
      } else {
        toast.error('Failed to expire notification');
      }
    } catch (error) {
      console.error('Error expiring notification:', error);
      toast.error('Failed to expire notification');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-amber-100 text-amber-800', label: 'Pending', icon: '⏳' },
      approved: { color: 'bg-emerald-100 text-emerald-800', label: 'Approved', icon: '✅' },
      requested: { color: 'bg-blue-100 text-blue-800', label: 'Requested', icon: '📨' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { color: 'bg-red-100 text-red-800', label: 'High' }
    };
    
    const config = urgencyConfig[urgency] || urgencyConfig.medium;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredProducts = products.filter(product => {
    const productName = product.title || product.name || '';
    const sellerName = product.user?.username || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || product.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const activeNotifications = notifications.filter(n => n.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-8xl mx-auto">
        {/* Modern Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 13L5.4 5H2" />
            </svg>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
            Market Control Center
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Streamline product approvals, engage with farmers, and drive market growth
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{stats.totalProducts}</p>
                  <p className="text-sm font-medium text-slate-500">Total Products</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{stats.pendingProducts}</p>
                  <p className="text-sm font-medium text-slate-500">Awaiting Review</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" 
                     style={{width: `${stats.totalProducts > 0 ? (stats.pendingProducts / stats.totalProducts) * 100 : 0}%`}}></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{stats.approvedProducts}</p>
                  <p className="text-sm font-medium text-slate-500">Live Products</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                     style={{width: `${stats.totalProducts > 0 ? (stats.approvedProducts / stats.totalProducts) * 100 : 0}%`}}></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V7a1 1 0 011-1h3a1 1 0 011 1v10z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{stats.activeNotifications}</p>
                  <p className="text-sm font-medium text-slate-500">Active Alerts</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Modern Products Section */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-200/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Marketplace</h2>
                  <div className="flex items-center space-x-4">
                    <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                      {filteredProducts.length} products
                    </span>
                    <span className="text-sm text-slate-600">Review and manage submissions</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products, farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">⏳ Pending Review</option>
                    <option value="approved">✅ Approved</option>
                    <option value="requested">📨 Requested</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
                <div>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm shadow-sm"
                  >
                    <option value="all">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>📍 {region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Modern Products Grid */}
            <div className="p-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No products found</h3>
                  <p className="text-slate-600 max-w-md mx-auto">Try adjusting your search or filter criteria to find what you're looking for.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group relative bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Product Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                                {product.title || product.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                {getStatusBadge(product.status)}
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                  {product.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                          {product.description}
                        </p>
                        
                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-xl">
                            <span className="text-2xl font-black text-emerald-600">${product.price || 0}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-700">{product.quantity}</div>
                            <div className="text-xs text-slate-500">{product.unit || 'units'}</div>
                          </div>
                        </div>
                        
                        {/* Seller Information */}
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {product.user?.username || product.seller || 'Unknown Farmer'}
                            </p>
                            <p className="text-xs text-slate-500">📍 {product.region}</p>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(product.created_at || product.dateAdded || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                          >
                            📋 View Details
                          </button>
                          
                          {(() => {
                            if (existingInterests.has(product.id)) {
                              return (
                                <button
                                  disabled
                                  className="flex-1 bg-blue-100 text-blue-600 px-4 py-3 rounded-xl text-sm font-semibold cursor-not-allowed"
                                >
                                  ✅ Interest Expressed
                                </button>
                              );
                            }
                            
                            return (
                              <button
                                onClick={() => handleRequestProduct(product.id)}
                                className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 hover:from-green-100 hover:to-emerald-100 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                              >
                                📤 Send Request
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modern Notifications Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Market Alerts</h2>
                  <p className="text-sm text-slate-600">Notify farmers about market opportunities</p>
                </div>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Alert</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5V7a1 1 0 011-1h3a1 1 0 011 1v10z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No active alerts</h3>
                  <p className="text-slate-600 text-sm">Create your first market notification to engage farmers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeNotifications.map((notification) => (
                    <div key={notification.id} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V7a1 1 0 011-1h3a1 1 0 011 1v10z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{notification.productNeeded}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {getUrgencyBadge(notification.urgency)}
                              <span className="text-xs text-slate-500">📍 {notification.region}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExpireNotification(notification.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove notification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Quantity:</span>
                          <span className="ml-1 font-semibold text-slate-700">{notification.quantity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Price Range:</span>
                          <span className="ml-1 font-semibold text-emerald-600">{notification.priceRange}</span>
                        </div>
                      </div>
                      
                      {notification.exactLocation && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500">Location:</span>
                          <span className="ml-1 text-slate-700">{notification.exactLocation}</span>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                        Expires: {new Date(notification.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Create Market Alert</h3>
              <button
                onClick={() => setShowNotificationForm(false)}
                className="text-slate-400 hover:text-slate-500 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notification Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                >
                  <option value="market_gap">Market Gap</option>
                  <option value="buyer_request">Individual Buyer Request</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Region *</label>
                <select
                  value={notificationForm.region}
                  onChange={(e) => setNotificationForm({...notificationForm, region: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Needed *</label>
                <input
                  type="text"
                  value={notificationForm.productNeeded}
                  onChange={(e) => setNotificationForm({...notificationForm, productNeeded: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
                  <input
                    type="text"
                    value={notificationForm.quantity}
                    onChange={(e) => setNotificationForm({...notificationForm, quantity: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                    placeholder="e.g., 100kg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range</label>
                  <input
                    type="text"
                    value={notificationForm.priceRange}
                    onChange={(e) => setNotificationForm({...notificationForm, priceRange: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                    placeholder="e.g., $1.5-$2.0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Exact Location</label>
                <input
                  type="text"
                  value={notificationForm.exactLocation}
                  onChange={(e) => setNotificationForm({...notificationForm, exactLocation: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                  placeholder="Specific location details"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Urgency</label>
                  <select
                    value={notificationForm.urgency}
                    onChange={(e) => setNotificationForm({...notificationForm, urgency: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={notificationForm.expiryDate}
                    onChange={(e) => setNotificationForm({...notificationForm, expiryDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowNotificationForm(false)}
                className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Product Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-500 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl h-48 flex items-center justify-center">
                  <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{selectedProduct.title || selectedProduct.name}</h4>
                  <p className="text-slate-600 mt-1">{selectedProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Price</label>
                    <p className="text-lg font-bold text-emerald-600">${selectedProduct.price}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Quantity</label>
                    <p className="text-lg font-bold text-slate-800">{selectedProduct.quantity} {selectedProduct.unit || 'units'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Category</label>
                    <p className="text-slate-800">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Region</label>
                    <p className="text-slate-800">{selectedProduct.region}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Seller Information</label>
                  <p className="text-slate-800">{selectedProduct.user?.username || selectedProduct.seller || 'Unknown'}</p>
                  <p className="text-slate-600 text-sm">{selectedProduct.user?.email || selectedProduct.contact || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Date Added</label>
                  <p className="text-slate-800">{new Date(selectedProduct.created_at || selectedProduct.dateAdded || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
              {(() => {
                if (existingInterests.has(selectedProduct.id)) {
                  return (
                    <button
                      disabled
                      className="px-6 py-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-xl cursor-not-allowed"
                    >
                      Interest Already Expressed
                    </button>
                  );
                }
                
                return (
                  <button
                    onClick={() => {
                      handleRequestProduct(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Send Request
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMarket;