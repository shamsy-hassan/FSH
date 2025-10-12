import React, { useState, useEffect } from 'react';
import { agriConnectAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ManageMarket = () => {
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
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

  const regions = ['North Region', 'South Region', 'East Region', 'West Region', 'Central Region'];
  const categories = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Meat', 'Other'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    updateStats();
  }, [products, notifications]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load products (all products for admin review)
      const productsResponse = await agriConnectAPI.market.getPosts();
      if (productsResponse.success) {
        setProducts(productsResponse.posts || []);
      }

      // Load notifications
      const notificationsResponse = await agriConnectAPI.market.getMarketNotifications();
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.notifications || []);
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

      // Use the market interest API to request the product
      const response = await agriConnectAPI.market.expressInterest(productId, {
        message: `Admin is interested in this product: ${product.title}`,
        offer_quantity: product.quantity
      });

      if (response.success) {
        // Update local state
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'requested', adminRequested: true } : p
        ));
        
        toast.success(`Request sent for ${product.title}. User has been notified.`);
      } else {
        toast.error('Failed to send request');
      }
    } catch (error) {
      console.error('Error requesting product:', error);
      toast.error('Failed to send request');
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const response = await agriConnectAPI.market.approvePost(productId);
      
      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'approved', approved: true } : p
        ));
        toast.success('Product approved successfully!');
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
      const response = await agriConnectAPI.market.updatePost(productId, { 
        status: 'rejected',
        approved: false 
      });
      
      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: 'rejected', approved: false } : p
        ));
        toast.success('Product rejected.');
      } else {
        toast.error('Failed to reject product');
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.region || !notificationForm.productNeeded) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await agriConnectAPI.market.createMarketNotification(notificationForm);
      
      if (response.success) {
        setNotifications([response.notification, ...notifications]);
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
        toast.success('Notification sent successfully!');
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };
  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await agriConnectAPI.market.deleteMarketNotification(notificationId);
      
      if (response.success) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
        toast.success('Notification deleted successfully');
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleExpireNotification = async (notificationId) => {
    try {
      const response = await agriConnectAPI.market.updateMarketNotification(notificationId, {
        status: 'expired'
      });
      
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
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '⏳' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: '✅' },
      requested: { color: 'bg-blue-100 text-blue-800', label: 'Requested', icon: '📨' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Market Management Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage products, send notifications, and monitor market activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approvedProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeNotifications}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Products Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
                <div className="flex space-x-3">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {filteredProducts.length} products
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="requested">Requested</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller & Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price & Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.title || product.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                Added {new Date(product.created_at || product.dateAdded || Date.now()).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.user?.username || product.seller || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{product.user?.email || product.contact || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{product.region}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${product.price || 0}</div>
                          <div className="text-sm text-gray-500">{product.quantity} {product.unit || 'units'}</div>
                          <div className="text-xs text-gray-400">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                            >
                              View
                            </button>
                            {product.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleRequestProduct(product.id)}
                                  className="text-green-600 hover:text-green-900 font-medium text-xs"
                                >
                                  Request
                                </button>
                                <button
                                  onClick={() => handleApproveProduct(product.id)}
                                  className="text-purple-600 hover:text-purple-900 font-medium text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectProduct(product.id)}
                                  className="text-red-600 hover:text-red-900 font-medium text-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Market Notifications</h2>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Send Notification</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {activeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 ${
                      notification.urgency === 'high' 
                        ? 'border-red-500 bg-red-50' 
                        : notification.urgency === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-400 bg-gray-50'
                    } p-4 rounded-r-lg transition-all hover:shadow-md`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'market_gap' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {notification.type === 'market_gap' ? '📊 Market Gap' : '👤 Buyer Request'}
                          </span>
                          {getUrgencyBadge(notification.urgency)}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="font-medium text-gray-700">Region:</span>{' '}
                            <span className="text-gray-900">{notification.region}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Product:</span>{' '}
                            <span className="text-gray-900">{notification.productNeeded}</span>
                          </div>
                          {notification.quantity && (
                            <div>
                              <span className="font-medium text-gray-700">Quantity:</span>{' '}
                              <span className="text-gray-900">{notification.quantity}</span>
                            </div>
                          )}
                          {notification.priceRange && (
                            <div>
                              <span className="font-medium text-gray-700">Price Range:</span>{' '}
                              <span className="text-gray-900">{notification.priceRange}</span>
                            </div>
                          )}
                          {notification.exactLocation && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Location:</span>{' '}
                              <span className="text-gray-900">{notification.exactLocation}</span>
                            </div>
                          )}
                          {notification.expiryDate && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Expires:</span>{' '}
                              <span className="text-gray-900">{new Date(notification.expiryDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{notification.views} views</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span>{notification.responses} responses</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleExpireNotification(notification.id)}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                          title="Mark as expired"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete notification"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {activeNotifications.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by sending a market notification.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Send Market Notification</h3>
              <button
                onClick={() => setShowNotificationForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="market_gap">Market Gap</option>
                  <option value="buyer_request">Individual Buyer Request</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <select
                  value={notificationForm.region}
                  onChange={(e) => setNotificationForm({...notificationForm, region: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Needed *</label>
                <input
                  type="text"
                  value={notificationForm.productNeeded}
                  onChange={(e) => setNotificationForm({...notificationForm, productNeeded: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="text"
                    value={notificationForm.quantity}
                    onChange={(e) => setNotificationForm({...notificationForm, quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 100kg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <input
                    type="text"
                    value={notificationForm.priceRange}
                    onChange={(e) => setNotificationForm({...notificationForm, priceRange: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., $1.5-$2.0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exact Location</label>
                <input
                  type="text"
                  value={notificationForm.exactLocation}
                  onChange={(e) => setNotificationForm({...notificationForm, exactLocation: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Specific location details"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={notificationForm.urgency}
                    onChange={(e) => setNotificationForm({...notificationForm, urgency: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={notificationForm.expiryDate}
                    onChange={(e) => setNotificationForm({...notificationForm, expiryDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNotificationForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                  <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-gray-600 mt-1">{selectedProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="text-lg font-semibold text-gray-900">${selectedProduct.price}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.quantity} units</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Region</label>
                    <p className="text-gray-900">{selectedProduct.region}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Seller Information</label>
                  <p className="text-gray-900">{selectedProduct.user?.username || selectedProduct.seller || 'Unknown'}</p>
                  <p className="text-gray-600 text-sm">{selectedProduct.user?.email || selectedProduct.contact || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Added</label>
                  <p className="text-gray-900">{new Date(selectedProduct.created_at || selectedProduct.dateAdded || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedProduct.status === 'pending' && (
                <button
                  onClick={() => handleRequestProduct(selectedProduct.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Request Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMarket;