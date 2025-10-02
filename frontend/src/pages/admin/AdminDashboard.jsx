import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import {
  FiUsers,
  FiShoppingCart,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiMessageSquare,
  FiSettings,
  FiBarChart2,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMoreVertical,
  FiPlus,
  FiEye,
  FiFileText
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    admin: null,
    system_metrics: [],
    pending_actions: [],
    policies: [],
    system_health: {}
  });
  const [policies, setPolicies] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashData = await agriConnectAPI.dashboard.getAdminDashboard();
      
      setDashboardData({
        admin: dashData.admin || null,
        system_metrics: dashData.system_metrics || [],
        pending_actions: dashData.pending_actions || [],
        policies: dashData.policies || [],
        system_health: dashData.system_health || {}
      });
      setPolicies(dashData.policies || []);
      setFeatures(dashData.management_areas || []);
      setError(null);
    } catch (err) {
      setError('Failed to load admin dashboard data');
      console.error('Admin dashboard error:', err);
      // Set safe defaults
      setDashboardData({
        admin: null,
        system_metrics: [],
        pending_actions: [],
        policies: [],
        system_health: {}
      });
      setPolicies([]);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      inactive: 'text-gray-600 bg-gray-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getMetricColor = (type) => {
    const colors = {
      users: 'bg-blue-500',
      posts: 'bg-green-500',
      orders: 'bg-purple-500',
      loans: 'bg-yellow-500',
      revenue: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { 
    admin = null, 
    system_metrics: metrics = [], 
    pending_actions = [], 
    policies: dashboardPolicies = []
  } = dashboardData;
  
  // Create a default recent_activities if not available
  const recent_activities = dashboardData.recent_activities || [
    {
      title: 'System Started',
      description: 'Admin dashboard loaded successfully',
      date: new Date().toISOString().slice(0, 16),
      type: 'system',
      icon: '⚙️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {admin.profile_picture ? (
                  <img
                    src={admin.profile_picture}
                    alt={admin.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
                    {admin.first_name?.charAt(0) || admin.username.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getTimeOfDay()}, {admin.first_name || admin.username}! 👨‍💼
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <FiSettings className="mr-1" />
                  Administrator • Last login {admin.last_login}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">System Status</p>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-lg font-semibold text-gray-900">All Systems Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getMetricColor(metric.type)}`}>
                  <span className="text-white text-xl">{metric.icon}</span>
                </div>
                {metric.change !== 0 && (
                  <span className={`text-sm font-medium ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {metric.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {metric.value}
              </p>
              <p className="text-sm text-gray-600">
                {metric.subtitle}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FiAlertCircle className="mr-2" />
                  Pending Actions
                </h2>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  {pending_actions.length} items
                </span>
              </div>
              
              {pending_actions.length > 0 ? (
                <div className="space-y-4">
                  {pending_actions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(action.priority).replace('text', 'bg').replace('bg-', 'bg-')}`}>
                          <span className="text-xl">{action.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {action.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(action.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <Link
                          to={action.link}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No pending actions at this time.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FiActivity className="mr-2" />
                  Recent System Activities
                </h2>
                <Link 
                  to="/admin/logs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All Logs
                </Link>
              </div>
              
              <div className="space-y-4">
                {recent_activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Management Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Management
              </h3>
              <div className="space-y-3">
                <Link
                  to="/admin/manage-users"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiUsers className="mr-3 text-blue-600" />
                  Manage Users
                </Link>
                <Link
                  to="/admin/manage-market"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiTrendingUp className="mr-3 text-green-600" />
                  Market Oversight
                </Link>
                <Link
                  to="/admin/manage-sacco"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiDollarSign className="mr-3 text-yellow-600" />
                  SACCO Management
                </Link>
                <Link
                  to="/admin/manage-orders"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiShoppingCart className="mr-3 text-purple-600" />
                  Order Management
                </Link>
                <Link
                  to="/admin/analytics"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiBarChart2 className="mr-3 text-orange-600" />
                  Analytics
                </Link>
              </div>
            </div>

            {/* System Policies */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiFileText className="mr-2" />
                System Policies
              </h3>
              <div className="space-y-3">
                {(dashboardPolicies || policies).slice(0, 4).map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{policy.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {policy.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated {policy.last_updated}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.status)}`}>
                        {policy.status}
                      </span>
                      <Link
                        to={`/admin/policies/${policy.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEye size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/policies"
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage All Policies
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Features Overview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Platform Features Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.slice(0, 6).map((feature) => (
              <div key={feature.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{feature.icon}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feature.status)}`}>
                    {feature.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Usage: {feature.usage_count || 0} times
                  </span>
                  <Link
                    to={`/admin/features/${feature.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
