import React, { useState, useEffect } from 'react';

const MyMarket = () => {
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    unreadNotifications: 0
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    region: '',
    image: null
  });

  const [pickupForm, setPickupForm] = useState({
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    deliveryDate: '',
    deliveryTime: '',
    deliveryAddress: '',
    specialInstructions: '',
    contactPerson: '',
    contactPhone: ''
  });

  const regions = ['North Region', 'South Region', 'East Region', 'West Region', 'Central Region'];
  const categories = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Meat', 'Other'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    updateStats();
  }, [products, notifications]);

  const loadInitialData = () => {
    const userProducts = [
      {
        id: 1,
        name: 'Fresh Tomatoes',
        description: 'Organic tomatoes from local farm, harvested daily',
        price: 2.5,
        quantity: 50,
        category: 'Vegetables',
        region: 'North Region',
        status: 'pending',
        adminRequested: false,
        dateAdded: '2024-01-15',
        views: 24,
        inquiries: 3
      },
      {
        id: 2,
        name: 'Organic Milk',
        description: 'Fresh organic milk from grass-fed cows',
        price: 3.0,
        quantity: 20,
        category: 'Dairy',
        region: 'South Region',
        status: 'approved',
        adminRequested: true,
        dateAdded: '2024-01-14',
        views: 45,
        inquiries: 8,
        pickupDetails: {
          pickupDate: '2024-01-20',
          pickupTime: '14:00',
          status: 'scheduled'
        }
      },
      {
        id: 3,
        name: 'Golden Apples',
        description: 'Sweet and crispy golden delicious apples',
        price: 1.8,
        quantity: 100,
        category: 'Fruits',
        region: 'East Region',
        status: 'requested',
        adminRequested: true,
        dateAdded: '2024-01-16',
        views: 31,
        inquiries: 5
      }
    ];

    const userNotifications = [
      {
        id: 1,
        type: 'market_gap',
        region: 'East Region',
        productNeeded: 'Carrots',
        quantity: '100kg',
        priceRange: '$1.5-$2.0',
        exactLocation: 'East Market, Stall 15',
        timestamp: '2024-01-15T10:30:00',
        read: false,
        urgency: 'high',
        expiryDate: '2024-01-25'
      },
      {
        id: 2,
        type: 'buyer_request',
        region: 'Central Region',
        productNeeded: 'Organic Eggs',
        quantity: '50 trays',
        priceRange: '$3.0-$4.0',
        exactLocation: 'Central Mall Food Court',
        timestamp: '2024-01-15T14:20:00',
        read: true,
        urgency: 'medium',
        expiryDate: '2024-01-22'
      },
      {
        id: 3,
        type: 'admin_request',
        productId: 2,
        productName: 'Organic Milk',
        message: 'Admin has requested your product "Organic Milk" for immediate purchase',
        timestamp: '2024-01-16T09:15:00',
        read: false,
        actionRequired: true
      }
    ];

    setProducts(userProducts);
    setNotifications(userNotifications);
  };

  const updateStats = () => {
    const totalProducts = products.length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const approvedProducts = products.filter(p => p.status === 'approved').length;
    const unreadNotifications = notifications.filter(n => !n.read).length;

    setStats({
      totalProducts,
      pendingProducts,
      approvedProducts,
      unreadNotifications
    });
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.quantity) {
      alert('Please fill in required fields');
      return;
    }

    const newProduct = {
      id: Date.now(),
      ...productForm,
      status: 'pending',
      adminRequested: false,
      dateAdded: new Date().toISOString().split('T')[0],
      views: 0,
      inquiries: 0
    };

    setProducts([newProduct, ...products]);
    setShowProductForm(false);
    resetProductForm();
    
    alert('Product added successfully! It will be reviewed by admin.');
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;

    setProducts(products.map(p => 
      p.id === editingProduct.id ? { ...p, ...productForm, status: 'pending' } : p
    ));
    
    setEditingProduct(null);
    setShowProductForm(false);
    resetProductForm();
    
    alert('Product updated successfully! Changes will be reviewed by admin.');
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully!');
    }
  };

  const handleApproveRequest = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && product.adminRequested) {
      setSelectedProduct(product);
      setShowPickupForm(true);
    }
  };

  const handleSubmitPickupForm = () => {
    if (!pickupForm.pickupDate || !pickupForm.pickupLocation || !pickupForm.deliveryAddress) {
      alert('Please fill in required fields');
      return;
    }

    setProducts(products.map(p => 
      p.id === selectedProduct.id ? { 
        ...p, 
        status: 'approved', 
        pickupDetails: {
          ...pickupForm,
          status: 'scheduled',
          scheduledAt: new Date().toISOString()
        }
      } : p
    ));

    // Mark related notification as read
    const relatedNotification = notifications.find(n => 
      n.type === 'admin_request' && n.productId === selectedProduct.id
    );
    if (relatedNotification) {
      markNotificationAsRead(relatedNotification.id);
    }

    setShowPickupForm(false);
    setSelectedProduct(null);
    resetPickupForm();

    alert('Pickup and delivery details submitted successfully! Admin has been notified.');
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      region: product.region,
      image: null
    });
    setShowProductForm(true);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review', icon: '⏳' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: '✅' },
      requested: { color: 'bg-blue-100 text-blue-800', label: 'Admin Requested', icon: '📨' },
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

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
      region: '',
      image: null
    });
  };

  const resetPickupForm = () => {
    setPickupForm({
      pickupDate: '',
      pickupTime: '',
      pickupLocation: '',
      deliveryDate: '',
      deliveryTime: '',
      deliveryAddress: '',
      specialInstructions: '',
      contactPerson: '',
      contactPhone: ''
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeNotifications = notifications.filter(n => !n.read || n.type === 'admin_request');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Market Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products and explore market opportunities</p>
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
                <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unreadNotifications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Products
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Market Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
                    <p className="text-gray-600 mt-1">Manage your product listings and track their status</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                    className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Product</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first product.</p>
                    <button
                      onClick={() => setShowProductForm(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          {getStatusBadge(product.status)}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <span className="font-medium text-gray-700">Price:</span>
                            <p className="text-green-600 font-semibold">${product.price}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <p className="text-gray-900">{product.quantity} units</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <p className="text-gray-900">{product.category}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Region:</span>
                            <p className="text-gray-900">{product.region}</p>
                          </div>
                        </div>

                        {/* Product Analytics */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{product.views} views</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span>{product.inquiries} inquiries</span>
                          </span>
                        </div>

                        {/* Pickup Status */}
                        {product.pickupDetails && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-blue-800">Pickup Scheduled</p>
                                <p className="text-xs text-blue-600">
                                  {new Date(product.pickupDetails.pickupDate).toLocaleDateString()} at {product.pickupDetails.pickupTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          {product.adminRequested && product.status === 'pending' ? (
                            <button
                              onClick={() => handleApproveRequest(product.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Approve Request
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditProduct(product)}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Market Notifications</h2>
                    <p className="text-gray-600 mt-1">Stay updated with market opportunities and admin requests</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="mt-4 sm:mt-0 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark All as Read
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {activeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${
                        !notification.read 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-50'
                      } p-4 rounded-r-lg`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              notification.type === 'market_gap' 
                                ? 'bg-purple-100 text-purple-800' 
                                : notification.type === 'buyer_request'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {notification.type === 'market_gap' ? '📊 Market Gap' : 
                               notification.type === 'buyer_request' ? '👤 Buyer Request' : '📨 Admin Request'}
                            </span>
                            {notification.urgency && getUrgencyBadge(notification.urgency)}
                            {!notification.read && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">New</span>
                            )}
                            {notification.actionRequired && (
                              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">Action Required</span>
                            )}
                          </div>
                          
                          {notification.type === 'admin_request' ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-2">{notification.message}</p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const product = products.find(p => p.id === notification.productId);
                                    if (product) handleApproveRequest(product.id);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  Approve & Schedule
                                </button>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-sm">
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
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeNotifications.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">Market notifications will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Total Views</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {products.reduce((sum, product) => sum + product.views, 0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Total Inquiries</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {products.reduce((sum, product) => sum + product.inquiries, 0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                          <span className="text-sm font-semibold text-green-600">
                            {stats.totalProducts > 0 ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setShowProductForm(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add New Product</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>View Notifications ({unreadCount} unread)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={productForm.region}
                    onChange={(e) => setProductForm({...productForm, region: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <input
                    type="file"
                    onChange={(e) => setProductForm({...productForm, image: e.target.files[0]})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingProduct ? handleEditProduct : handleAddProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup and Delivery Form Modal */}
      {showPickupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Schedule Pickup & Delivery</h3>
              <button
                onClick={() => setShowPickupForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedProduct && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Product Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Product:</span>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Quantity:</span>
                    <p className="font-medium">{selectedProduct.quantity} units</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Price:</span>
                    <p className="font-medium">${selectedProduct.price}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Value:</span>
                    <p className="font-medium">${(selectedProduct.price * selectedProduct.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Pickup Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                    <input
                      type="date"
                      value={pickupForm.pickupDate}
                      onChange={(e) => setPickupForm({...pickupForm, pickupDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                    <input
                      type="time"
                      value={pickupForm.pickupTime}
                      onChange={(e) => setPickupForm({...pickupForm, pickupTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location *</label>
                    <input
                      type="text"
                      value={pickupForm.pickupLocation}
                      onChange={(e) => setPickupForm({...pickupForm, pickupLocation: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter complete pickup address"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Delivery Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={pickupForm.deliveryDate}
                      onChange={(e) => setPickupForm({...pickupForm, deliveryDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                    <input
                      type="time"
                      value={pickupForm.deliveryTime}
                      onChange={(e) => setPickupForm({...pickupForm, deliveryTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      value={pickupForm.deliveryAddress}
                      onChange={(e) => setPickupForm({...pickupForm, deliveryAddress: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter complete delivery address"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={pickupForm.contactPerson}
                    onChange={(e) => setPickupForm({...pickupForm, contactPerson: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name of contact person"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={pickupForm.contactPhone}
                    onChange={(e) => setPickupForm({...pickupForm, contactPhone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={pickupForm.specialInstructions}
                  onChange={(e) => setPickupForm({...pickupForm, specialInstructions: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special instructions for pickup or delivery, access codes, etc."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPickupForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPickupForm}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMarket;