// MyOrders.jsx
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { agriConnectAPI } from "../../services/api";
import { 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiXCircle, 
  FiRefreshCw, 
  FiShoppingBag, 
  FiArrowLeft, 
  FiHome, 
  FiPlus,
  FiSearch,
  FiFilter,
  FiEye,
  FiDownload,
  FiMessageSquare
} from 'react-icons/fi';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching user orders with filter:', statusFilter);
      
      const response = await agriConnectAPI.order.getUserOrders({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      
      console.log('Orders response:', response);
      setOrders(response.orders || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load your orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchOrders();
    }, 500);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
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
      label: "Pending Review"
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
      label: "Cancelled"
    }
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</h3>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[order.status]?.class}`}>
            {statusStyles[order.status]?.icon}
            <span className="ml-1">{statusStyles[order.status]?.label}</span>
          </span>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Delivery Information</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">{order.delivery_location}</p>
              <p className="text-gray-600">{order.delivery_date ? `Est. delivery: ${order.delivery_date}` : 'Delivery date to be confirmed'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              {order.items?.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total and Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(order.total_amount)}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedOrder(order)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FiEye className="w-4 h-4 mr-1" />
              View Details
            </button>
            
            {order.status === "pending" && (
              <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                <FiMessageSquare className="w-4 h-4 mr-1" />
                Contact Support
              </button>
            )}
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
          <p className="text-lg font-medium text-gray-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-green-100 hover:text-white mb-4 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back
              </button>
              <h1 className="text-4xl font-bold mb-2">My Orders</h1>
              <p className="text-green-100 text-lg">Track your agricultural inputs orders</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  refreshing ? 'bg-green-700 text-green-300' : 'bg-white text-green-700 hover:bg-green-50'
                }`}
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => navigate('/user/ecommerce')}
                className="flex items-center px-6 py-3 bg-yellow-400 text-green-900 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
              >
                <FiPlus className="mr-2" />
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders by number or product..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-medium text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/user/ecommerce')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Start Shopping
              </button>
              <button
                onClick={() => navigate('/user/dashboard')}
                className="text-green-600 hover:text-green-700 flex items-center justify-center mx-auto"
              >
                <FiHome className="mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Order Details</h3>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Order Information</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Order Number:</dt>
                          <dd className="font-medium">{selectedOrder.order_number}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Order Date:</dt>
                          <dd className="font-medium">{formatDate(selectedOrder.created_at)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Status:</dt>
                          <dd className="font-medium">{selectedOrder.status}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Delivery Information</h4>
                      <dl className="space-y-1 text-sm">
                        <div>
                          <dt className="text-gray-600">Delivery Location:</dt>
                          <dd className="font-medium">{selectedOrder.delivery_location}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Estimated Delivery:</dt>
                          <dd className="font-medium">{selectedOrder.delivery_date || 'To be confirmed'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                            <p className="text-sm text-gray-600">Total: {formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download Invoice
                    </button>
                    <button className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <FiMessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        <section className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Order Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
              <h3 className="font-semibold mb-3 text-blue-700">Track Delivery</h3>
              <p className="text-sm text-gray-600 mb-4">Real-time tracking for your agricultural inputs delivery status.</p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Track Your Order →
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
              <h3 className="font-semibold mb-3 text-green-700">Returns & Refunds</h3>
              <p className="text-sm text-gray-600 mb-4">Easy returns within 7 days for quality issues with full refund guarantee.</p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Return Policy →
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
              <h3 className="font-semibold mb-3 text-purple-700">Customer Support</h3>
              <p className="text-sm text-gray-600 mb-4">24/7 customer support for order assistance and farm input guidance.</p>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Contact Support →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}