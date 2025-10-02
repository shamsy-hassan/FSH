import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import {
  FiTrendingUp,
  FiUsers,
  FiShoppingCart,
  FiMessageCircle,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiActivity,
  FiBell,
  FiStar,
  FiDollarSign
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    user: null,
    activities: [],
    recent_activities: [],
    policies: [],
    features: [],
    sacco_status: {
      is_member: false,
      member_since: null,
      active_loans: 0
    }
  });
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashData = await agriConnectAPI.dashboard.getUserDashboard();
      
      setDashboardData({
        user: dashData.user || null,
        activities: dashData.activities || [],
        recent_activities: dashData.recent_activities || [],
        policies: dashData.policies || [],
        features: dashData.features || [],
        sacco_status: dashData.sacco_status || {
          is_member: false,
          member_since: null,
          active_loans: 0
        }
      });
      setFeatures(dashData.features || []);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
      // Set safe defaults to prevent map errors
      setDashboardData({
        user: null,
        activities: [],
        recent_activities: [],
        policies: [],
        features: [],
        sacco_status: {
          is_member: false,
          member_since: null,
          active_loans: 0
        }
      });
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (color) => {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <motion.button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const { 
    user, 
    activities = [], 
    recent_activities = [], 
    sacco_status = { is_member: false, member_since: null, active_loans: 0 } 
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow-lg border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-green-600">
                    {user.first_name?.charAt(0) || user.username.charAt(0)}
                  </span>
                )}
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getTimeOfDay()}, {user.first_name || user.username}! 🌾
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <FiMapPin className="mr-1" />
                  {user.location} • Member since {user.member_since}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activities.map((activity, index) => (
            <Link
              key={index}
              to={activity.link}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getActivityColor(activity.color)}`}>
                  <span className="text-2xl">{activity.icon}</span>
                </div>
                <FiArrowRight className="text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {activity.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {activity.count}
              </p>
              {activity.recent > 0 && (
                <p className="text-sm text-green-600">
                  +{activity.recent} this month
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FiActivity className="mr-2" />
                  Recent Activities
                </h2>
                <Link 
                  to="/market"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              
              {recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {recent_activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiActivity className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activities</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start trading or posting to see your activities here.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/market"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <FiTrendingUp className="mr-2" />
                      Create Market Post
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            {/* SACCO Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiDollarSign className="mr-2" />
                SACCO Status
              </h3>
              {sacco_status?.is_member ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {sacco_status?.member_since}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Active loans</span>
                    <span className="text-sm font-medium text-gray-900">
                      {sacco_status?.active_loans}
                    </span>
                  </div>
                  <Link
                    to="/sacco"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    View SACCO Dashboard
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Join our SACCO to access financial services
                  </p>
                  <Link
                    to="/sacco"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Join SACCO
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/market"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiTrendingUp className="mr-3 text-green-600" />
                  Post to Market
                </Link>
                <Link
                  to="/ecommerce"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiShoppingCart className="mr-3 text-blue-600" />
                  Browse Products
                </Link>
                <Link
                  to="/communicate"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiMessageCircle className="mr-3 text-purple-600" />
                  Start Conversation
                </Link>
                <Link
                  to="/agroclimate"
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiCalendar className="mr-3 text-orange-600" />
                  Check Weather
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Explore Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(features || []).slice(0, 6).map((feature, index) => (
              <div key={feature.id || index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{feature.icon}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {feature.status || 'Available'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <div className="space-y-1 mb-4">
                  {(feature.benefits || []).slice(0, 2).map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <FiStar className="mr-2 text-yellow-500 flex-shrink-0" size={12} />
                      {benefit}
                    </div>
                  ))}
                  {(!feature.benefits || feature.benefits.length === 0) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiStar className="mr-2 text-yellow-500 flex-shrink-0" size={12} />
                      Easy to use and accessible
                    </div>
                  )}
                </div>
                <Link
                  to={feature.link}
                  className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Learn More
                  <FiArrowRight className="ml-1" size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
