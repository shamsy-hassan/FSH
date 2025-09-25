import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { agriConnectAPI } from "../../services/api";
import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiRefreshCw, FiShoppingBag, FiArrowLeft, FiHome, FiPlus } from 'react-icons/fi';

export default function MyOrders({ farmerId }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced fallback sample data
  const fallbackOrders = [
    {
      id: 1,
      order_number: "#ORD-001",
      created_at: new Date().toISOString(),
      total_amount: 4500,
      status: "delivered",
      payment_status: "completed",
      deliveryLocation: "Nairobi Central, Kenya",
      deliveryDate: "2025-09-25",
      shipping_address: "Plot 45, Ngong Road\nNairobi, Kenya\nPhone: +254 700 123 456",
      items: [
        {
          id: 1,
          product_id: 1,
          product: { name: "Maize Seeds - 50kg", image: "🌽" },
          quantity: 2,
          price: 2250,
          subtotal: 4500
        }
      ]
    },
    {
      id: 2,
      order_number: "#ORD-002",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 3200,
      status: "pending",
      payment_status: "pending",
      deliveryLocation: "Meru Town, Kenya",
      deliveryDate: "2025-09-28",
      shipping_address: "Kenia Farm, Meru\nMeru County, Kenya\nPhone: +254 711 987 654",
      items: [
        {
          id: 2,
          product_id: 2,
          product: { name: "DAP Fertilizer - 50kg", image: "🧪" },
          quantity: 4,
          price: 800,
          subtotal: 3200
        }
      ]
    }
  ];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await agriConnectAPI.order.getOrders(statusFilter, page, 10);
      setOrders(response.orders || []);
      setTotalPages(response.pages || 1);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders(fallbackOrders.filter(order => 
        statusFilter === "all" || order.status === statusFilter
      ));
      setTotalPages(1);
      setError("Using demo data - connection temporarily unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const statusStyles = {
    pending: {
      class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: <FiClock className="mr-1" />,
      badge: "🕒"
    },
    processing: {
      class: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <FiCheckCircle className="mr-1" />,
      badge: "⚙️"
    },
    shipped: {
      class: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: <FiTruck className="mr-1" />,
      badge: "🚚"
    },
    delivered: {
      class: "bg-green-100 text-green-800 border-green-200",
      icon: <FiCheckCircle className="mr-1" />,
      badge: "✅"
    },
    cancelled: {
      class: "bg-red-100 text-red-800 border-red-200",
      icon: <FiXCircle className="mr-1" />,
      badge: "❌"
    },
    refunded: {
      class: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <FiXCircle className="mr-1" />,
      badge: "💸"
    }
  };

  const getStatusBadge = (status) => {
    return statusStyles[status]?.badge || "📦";
  };

  const addToCart = async (productId, quantity = 1) => {
    console.log('addToCart called with:', { productId, quantity }); // Debug log
    
    if (!user) {
        console.log('User not authenticated'); // Debug log
        setError('Please log in to add items to cart');
        return;
    }

    try {
        console.log('Making API call to add to cart'); // Debug log
        const response = await agriConnectAPI.ecommerce.addToCart(productId, quantity);
        console.log('Add to cart response:', response); // Debug log
        
        setSuccess('Product added to cart successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
        console.error('Error adding to cart:', error); // Debug log
        setError('Failed to add product to cart');
        
        // Clear error message after 5 seconds
        setTimeout(() => setError(''), 5000);
    }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-green-100 hover:text-white mb-4 transition"
              >
                <FiArrowLeft className="mr-2" />
                Back
              </button>
              <h1 className="text-4xl font-bold mb-2">📦 My Orders</h1>
              <p className="text-green-100 text-lg">
                Track your agricultural inputs orders and manage your purchases
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  refreshing 
                    ? 'bg-green-700 text-green-300 cursor-not-allowed' 
                    : 'bg-white text-green-700 hover:bg-green-50'
                }`}
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => navigate('/user/ecommerce')}
                className="flex items-center px-6 py-3 bg-yellow-400 text-green-900 rounded-lg font-medium hover:bg-yellow-300 transition-all"
              >
                <FiPlus className="mr-2" />
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">📦 All Orders ({orders.length})</option>
                <option value="pending">🕒 Pending</option>
                <option value="processing">⚙️ Processing</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">✅ Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-800">
                <span className="font-semibold">{orders.length}</span> orders found
                {statusFilter !== 'all' && ` (${statusFilter})`}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-medium text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/user/ecommerce')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center mx-auto"
              >
                <FiShoppingBag className="mr-2" />
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
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {getStatusBadge(order.status)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          📅 Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full border capitalize flex items-center ${
                        statusStyles[order.status]?.class || "bg-gray-100 text-gray-800 border-gray-200"
                      }`}>
                        {statusStyles[order.status]?.icon}
                        {order.status}
                      </span>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          KSh {order.total_amount?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {order.payment_status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Delivery Information */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        🚚 Delivery Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-800">{order.deliveryLocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Delivery:</span>
                          <span className="font-medium text-gray-800">{order.deliveryDate || "To be confirmed"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={`font-medium ${
                            order.payment_status === "completed" ? "text-green-600" : "text-yellow-600"
                          }`}>
                            {order.payment_status === "completed" ? "✅ Paid" : "🕒 Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        📋 Order Summary
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.product?.image || "📦"}</span>
                              <div>
                                <div className="font-medium text-gray-800">
                                  {item.product?.name || `Product #${item.product_id}`}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Qty: {item.quantity} × KSh {item.price?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="font-semibold text-gray-800">
                              KSh {item.subtotal?.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-3">
                      {order.status === "pending" && (
                        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium">
                          📞 Contact Support
                        </button>
                      )}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                          🗺️ Track Order
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                        📄 View Invoice
                      </button>
                      {order.status === "delivered" && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                          ⭐ Rate Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 font-medium">
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

        {/* Enhanced Support Section */}
        <section className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-800 flex items-center">
            🛟 Order Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
              <h3 className="font-semibold mb-3 text-blue-700 flex items-center">
                🗺️ Track Delivery
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Real-time tracking for all your agricultural inputs delivery status.
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Track Your Order →
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
              <h3 className="font-semibold mb-3 text-green-700 flex items-center">
                🔄 Returns & Refunds
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Easy returns within 7 days for quality issues with full refund guarantee.
              </p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Return Policy →
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
              <h3 className="font-semibold mb-3 text-purple-700 flex items-center">
                📞 Customer Support
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                24/7 customer support for order assistance and farm input guidance.
              </p>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Contact Support →
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions Footer */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-800">Ready for your next order?</h3>
              <p className="text-sm text-gray-600">Explore our latest agricultural inputs</p>
            </div>
            <button
              onClick={() => navigate('/user/ecommerce')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
            >
              <FiShoppingBag className="mr-2" />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}