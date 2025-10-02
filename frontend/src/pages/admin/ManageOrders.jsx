// ManageOrders.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiXCircle, 
  FiSearch, 
  FiFilter,
  FiDollarSign,
  FiPackage,
  FiUser,
  FiMapPin,
  FiEye,
  FiDownload,
  FiBarChart2,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiNavigation,
  FiCalendar
} from 'react-icons/fi';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await agriConnectAPI.order.getOrders({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: page,
        limit: 12,
        search: searchTerm || undefined
      });
      
      if (response && response.orders) {
        setOrders(response.orders);
        setTotalPages(response.pages || 1);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await agriConnectAPI.order.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order status updated to ${newStatus} successfully!`);
      fetchOrders(); // Refresh data
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update order status. Please try again.");
      console.error("Failed to update order:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const statusStyles = {
    pending: {
      class: "bg-yellow-50 text-yellow-800 border-yellow-200",
      icon: <FiClock className="w-4 h-4" />,
      label: "Pending"
    },
    processing: {
      class: "bg-blue-50 text-blue-800 border-blue-200",
      icon: <FiCheckCircle className="w-4 h-4" />,
      label: "Processing"
    },
    shipped: {
      class: "bg-indigo-50 text-indigo-800 border-indigo-200",
      icon: <FiTruck className="w-4 h-4" />,
      label: "Shipped"
    },
    delivered: {
      class: "bg-green-50 text-green-800 border-green-200",
      icon: <FiCheckCircle className="w-4 h-4" />,
      label: "Delivered"
    },
    cancelled: {
      class: "bg-red-50 text-red-800 border-red-200",
      icon: <FiXCircle className="w-4 h-4" />,
      label: "Cancelled"
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchOrders();
    }, 500);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
    fetchOrders();
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Order Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[order.status]?.class}`}>
            {statusStyles[order.status]?.icon}
            <span className="ml-1">{statusStyles[order.status]?.label}</span>
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center text-gray-600">
            <FiUser className="w-4 h-4 mr-1" />
            {order.customer_name || order.customer}
          </span>
          <span className="flex items-center text-gray-600">
            <FiMapPin className="w-4 h-4 mr-1" />
            {order.delivery_location}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 border-b border-gray-100">
        <div className="space-y-2">
          {order.items?.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 truncate">{item.product_name}</span>
              <span className="text-gray-900 font-medium">x{item.quantity}</span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{order.items.length - 2} more items
            </div>
          )}
        </div>
      </div>

      {/* Order Footer */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(order.total_amount)}
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedOrder(order)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiEye className="w-4 h-4 mr-1" />
            View Details
          </button>
        </div>

        {/* Status Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {order.status === "pending" && (
            <>
              <button
                onClick={() => updateOrderStatus(order.id, "processing")}
                className="px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => updateOrderStatus(order.id, "cancelled")}
                className="px-2 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          
          {order.status === "processing" && (
            <button
              onClick={() => updateOrderStatus(order.id, "shipped")}
              className="col-span-2 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
            >
              Mark as Shipped
            </button>
          )}
          
          {order.status === "shipped" && (
            <button
              onClick={() => updateOrderStatus(order.id, "delivered")}
              className="col-span-2 px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
            >
              Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const OrderListView = ({ order }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className={`p-2 rounded-lg ${statusStyles[order.status]?.class}`}>
            {statusStyles[order.status]?.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{order.order_number}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[order.status]?.class}`}>
                {statusStyles[order.status]?.label}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FiUser className="w-4 h-4 mr-1" />
                {order.customer_name}
              </span>
              <span className="flex items-center">
                <FiMapPin className="w-4 h-4 mr-1" />
                {order.delivery_location}
              </span>
              <span className="flex items-center">
                <FiPackage className="w-4 h-4 mr-1" />
                {order.items?.length} items
              </span>
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="text-lg font-bold text-green-600 mb-1">
            {formatCurrency(order.total_amount)}
          </div>
          <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setSelectedOrder(order)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Enhanced Order Detail Modal with comprehensive information
  const OrderDetailModal = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Order Details - {order.order_number}</h3>
              <p className="text-sm text-gray-600">Placed on {formatDate(order.created_at)}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Full Name:</span>
                    <span className="text-sm text-gray-900">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{order.customer_email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <span className="text-sm text-gray-900">{order.customer_phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Customer ID:</span>
                    <span className="text-sm text-gray-900">{order.customer_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2 text-green-600" />
                  Delivery Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Delivery Address:</span>
                    <span className="text-sm text-gray-900 text-right">{order.delivery_address || order.delivery_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">City/Town:</span>
                    <span className="text-sm text-gray-900">{order.delivery_city || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Postal Code:</span>
                    <span className="text-sm text-gray-900">{order.postal_code || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Delivery Instructions:</span>
                    <span className="text-sm text-gray-900">{order.delivery_instructions || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order & Payment Information */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiPackage className="w-5 h-5 mr-2 text-purple-600" />
                  Order Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Order Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]?.class}`}>
                      {statusStyles[order.status]?.icon}
                      <span className="ml-1">{statusStyles[order.status]?.label}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                    <span className={`text-sm font-medium ${
                      order.payment_status === 'completed' ? 'text-green-600' : 
                      order.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Estimated Delivery:</span>
                    <span className="text-sm text-gray-900">{order.estimated_delivery ? formatDate(order.estimated_delivery) : 'To be confirmed'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                  Payment Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                    <span className="text-sm text-gray-900">{order.payment_method?.replace(/_/g, ' ').toUpperCase() || 'Cash on Delivery'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                    <span className="text-sm text-gray-900">{order.transaction_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Date:</span>
                    <span className="text-sm text-gray-900">{order.payment_date ? formatDate(order.payment_date) : 'Pending'}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiPackage className="w-5 h-5 mr-2 text-orange-600" />
                  Order Items ({order.items?.length || 0})
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.product_sku || 'N/A'} | Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-gray-600">Total: {formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Total */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Order Total</span>
              <span className="text-2xl text-green-600">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FiDownload className="w-4 h-4 mr-2" />
              Download Invoice
            </button>
            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FiMail className="w-4 h-4 mr-2" />
              Contact Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Manage and track all customer orders</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount, 0))}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <FiBarChart2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders by number, customer, or location..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FiXCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-800 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-800">{success}</p>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-800 hover:text-green-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Orders Grid/List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}`}>
              {orders.map((order) => 
                viewMode === "grid" ? 
                  <OrderCard key={order.id} order={order} /> : 
                  <OrderListView key={order.id} order={order} />
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Order Detail Modal */}
        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </div>
    </div>
  );
}