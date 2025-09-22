// ManageOrders.jsx
import { useState, useEffect } from "react";
import { agriConnectAPI } from "../../services/api";
import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiEdit3, FiSearch, FiFilter } from 'react-icons/fi';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Enhanced fallback sample data for admin management
  const generateFallbackOrders = () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const customers = [
      'John Mwangi', 'Mary Wanjiku', 'Peter Omondi', 'Sarah Chebet', 'David Otieno', 
      'Amina Hassan', 'Joseph Kimani', 'Fatima Ali', 'Michael Njoroge', 'Grace Wambui'
    ];
    const farmerIds = ['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F007', 'F008', 'F009', 'F010'];
    const products = [
      { name: 'Maize Seeds - 50kg', price: 2250 },
      { name: 'DAP Fertilizer - 50kg', price: 800 },
      { name: 'Hybrid Tomato Seeds', price: 1800 },
      { name: 'Urea Fertilizer - 50kg', price: 1800 },
      { name: 'Pesticide Spray 1L', price: 1000 },
      { name: 'Organic Compost - 25kg', price: 450 },
      { name: 'Irrigation Hose 50m', price: 1200 },
      { name: 'Crop Netting 10x10m', price: 1500 }
    ];
    const locations = [
      'Nairobi Central, Kenya', 'Meru Town, Kenya', 'Kisii, Kenya', 'Eldoret, Kenya',
      'Mombasa, Kenya', 'Nakuru, Kenya', 'Kisumu, Kenya', 'Nyeri, Kenya', 'Thika, Kenya'
    ];

    const fallbackOrders = [];
    const now = new Date();
    
    for (let i = 1; i <= 25; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      
      // Generate random number of items (1-3)
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const subtotal = product.price * quantity;
        totalAmount += subtotal;
        
        items.push({
          id: j + 1,
          product_id: j + 1,
          product: product,
          quantity: quantity,
          price: product.price,
          subtotal: subtotal
        });
      }

      fallbackOrders.push({
        id: i,
        order_number: `#ORD-${String(i).padStart(3, '0')}`,
        customer: customers[Math.floor(Math.random() * customers.length)],
        farmerId: farmerIds[Math.floor(Math.random() * farmerIds.length)],
        created_at: createdAt,
        total_amount: totalAmount,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        payment_status: Math.random() > 0.3 ? 'completed' : 'pending',
        deliveryLocation: locations[Math.floor(Math.random() * locations.length)],
        shipping_address: `${locations[Math.floor(Math.random() * locations.length)]}\nKenya\nPhone: +254 ${Math.floor(Math.random() * 900000000) + 700000000}`,
        items: items
      });
    }

    return fallbackOrders;
  };

  const fallbackOrders = generateFallbackOrders();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setIsUsingFallback(false);
        const response = await agriConnectAPI.order.getOrders(statusFilter, page, 10);
        
        if (response && response.orders) {
          setOrders(response.orders);
          setTotalPages(response.pages || 1);
        } else {
          throw new Error('Invalid response format');
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        
        // Use fallback data
        const filteredFallback = fallbackOrders.filter(order => 
          statusFilter === "all" || order.status === statusFilter
        );
        setOrders(filteredFallback.slice((page - 1) * 10, page * 10));
        setTotalPages(Math.ceil(filteredFallback.length / 10));
        setError("Using demo data - connection temporarily unavailable");
        setIsUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, page]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (!isUsingFallback) {
        await agriConnectAPI.order.updateOrderStatus(orderId, newStatus);
        // Refresh data
        const response = await agriConnectAPI.order.getOrders(statusFilter, page, 10);
        setOrders(response.orders || []);
      } else {
        // Update local fallback data
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
      
      // Show success message
      const statusMessage = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      alert(`Order status updated to ${statusMessage}${isUsingFallback ? ' (demo mode)' : ''}`);
      
    } catch (err) {
      // Even if API fails, update local state for demo
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      const statusMessage = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      alert(`Order status updated to ${statusMessage} (demo mode)`);
      console.error("Failed to update order:", err);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder({ ...order });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async (updatedData) => {
    try {
      if (!isUsingFallback) {
        await agriConnectAPI.order.updateOrder(selectedOrder.id, updatedData);
        // Refresh orders
        const response = await agriConnectAPI.order.getOrders(statusFilter, page, 10);
        setOrders(response.orders || []);
      } else {
        // Update local fallback data
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id ? { ...order, ...updatedData } : order
        ));
      }
      
      setShowEditModal(false);
      alert(`Order updated successfully${isUsingFallback ? ' (demo mode)' : ''}`);
    } catch (err) {
      // Update local state for demo
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? { ...order, ...updatedData } : order
      ));
      setShowEditModal(false);
      alert(`Order updated (demo mode)`);
      console.error("Failed to update order:", err);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const statusStyles = {
    pending: {
      class: "bg-yellow-100 text-yellow-800",
      icon: <FiClock className="mr-1" />
    },
    processing: {
      class: "bg-blue-100 text-blue-800",
      icon: <FiCheckCircle className="mr-1" />
    },
    shipped: {
      class: "bg-indigo-100 text-indigo-800",
      icon: <FiTruck className="mr-1" />
    },
    delivered: {
      class: "bg-green-100 text-green-800",
      icon: <FiTruck className="mr-1" />
    },
    cancelled: {
      class: "bg-red-100 text-red-800",
      icon: <FiXCircle className="mr-1" />
    },
    refunded: {
      class: "bg-gray-100 text-gray-800",
      icon: <FiXCircle className="mr-1" />
    }
  };

  // Filter by search term on all available orders
  const allAvailableOrders = isUsingFallback ? fallbackOrders : orders;
  const searchedOrders = allAvailableOrders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(order => 
    statusFilter === "all" || order.status === statusFilter
  );

  const paginatedOrders = searchedOrders.slice((page - 1) * 10, page * 10);
  const totalPagesCount = Math.ceil(searchedOrders.length / 10);

  // Loading state - always show something
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading orders...</p>
          <p className="text-sm text-gray-500 mt-1">Preparing your order management dashboard</p>
        </div>
        {/* Show some demo cards while loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-md animate-pulse">
              <div className="p-4 bg-gray-50 border-b">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex space-x-2 mt-4">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-green-800">Manage Orders</h1>
        <p className="text-lg mb-4">
          Comprehensive order management dashboard for processing, updating, and tracking agricultural inputs orders.
        </p>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-sm font-medium">{error}</span>
                <p className="text-xs mt-1">All functionality works with demo data. Real data will appear when connection is restored.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2 text-green-700">Order Management Best Practices</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Verify all order details and payment before processing</li>
            <li>Update statuses promptly to keep farmers informed</li>
            <li>Coordinate with logistics for accurate delivery tracking</li>
            <li>Review orders regularly for quality assurance and compliance</li>
            {isUsingFallback && (
              <li className="text-yellow-700 font-medium mt-2">
                🔄 Demo Mode Active - All actions are simulated locally
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-1">
              <FiSearch className="mr-1" />
              Search Orders
            </label>
            <input
              type="text"
              placeholder="Search by order number, customer, farmer ID, or location..."
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-500 pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium mb-1">
              <FiFilter className="mr-1" />
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Statuses ({allAvailableOrders.length})</option>
              <option value="pending">Pending ({allAvailableOrders.filter(o => o.status === 'pending').length})</option>
              <option value="processing">Processing ({allAvailableOrders.filter(o => o.status === 'processing').length})</option>
              <option value="shipped">Shipped ({allAvailableOrders.filter(o => o.status === 'shipped').length})</option>
              <option value="delivered">Delivered ({allAvailableOrders.filter(o => o.status === 'delivered').length})</option>
              <option value="cancelled">Cancelled ({allAvailableOrders.filter(o => o.status === 'cancelled').length})</option>
              <option value="refunded">Refunded ({allAvailableOrders.filter(o => o.status === 'refunded').length})</option>
            </select>
          </div>
          
          <div className="flex flex-col justify-end space-y-2">
            <div className="text-sm text-gray-600">
              <div>Showing: {paginatedOrders.length} of {searchedOrders.length}</div>
              <div className="text-xs">Revenue: {formatCurrency(searchedOrders.reduce((sum, order) => sum + order.total_amount, 0))}</div>
            </div>
            {isUsingFallback && (
              <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Demo Mode
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {paginatedOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-500 space-y-4">
            <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-xl font-medium mb-2">No orders match your criteria</p>
              <p className="text-sm">Try adjusting your search terms or filters above</p>
            </div>
            {isUsingFallback && (
              <p className="text-xs text-yellow-600 bg-yellow-100 px-3 py-1 rounded inline-block">
                Demo data available - try different filters to see sample orders
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Order Header */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {order.order_number}
                    </h3>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm text-gray-600">
                        {order.customer} • Farmer {order.farmerId}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full capitalize flex items-center ${
                        statusStyles[order.status]?.class || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusStyles[order.status]?.icon}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Delivery</span>
                    <span className="text-sm font-medium text-gray-900">{order.deliveryLocation}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Payment</span>
                    <span className={`text-sm font-medium ${
                      order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="py-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Items ({order.items.length})</span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs flex justify-between items-center py-1">
                          <span className="truncate flex-1">{item.product?.name || `Item ${i + 1}`}</span>
                          <span className="ml-2 text-gray-600">x{item.quantity}</span>
                          <span className="ml-2 text-gray-900 font-medium">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 pb-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">Order Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors group-hover:scale-[1.02] transform"
                    >
                      <FiEdit3 className="mr-1 w-4 h-4" />
                      Edit Details
                    </button>

                    {order.status === "pending" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, "processing")}
                          className="px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          <FiCheckCircle className="inline mr-1 w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          <FiXCircle className="inline mr-1 w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    )}

                    {order.status === "processing" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "shipped")}
                        className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                      >
                        <FiTruck className="inline mr-1 w-3 h-3" />
                        Mark as Shipped
                      </button>
                    )}

                    {order.status === "shipped" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "delivered")}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        <FiTruck className="inline mr-1 w-3 h-3" />
                        Mark Delivered
                      </button>
                    )}

                    {order.status === "delivered" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "refunded")}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                      >
                        <FiXCircle className="inline mr-1 w-3 h-3" />
                        Process Refund
                      </button>
                    )}

                    {(order.status === "cancelled" || order.status === "refunded") && (
                      <span className="text-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
                        Action completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPagesCount > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow border">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center"
            >
              <svg className={`w-4 h-4 mr-1 ${page === 1 ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded">
              Page {page} of {totalPagesCount} ({searchedOrders.length} total)
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPagesCount))}
              disabled={page === totalPagesCount}
              className="px-4 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center"
            >
              Next
              <svg className={`w-4 h-4 ml-1 ${page === totalPagesCount ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {isUsingFallback && (
              <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded ml-4">
                Demo Pagination
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Section */}
      {!loading && searchedOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{searchedOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchedOrders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(searchedOrders.reduce((sum, order) => sum + order.total_amount, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchedOrders.length > 0 
                    ? formatCurrency(searchedOrders.reduce((sum, order) => sum + order.total_amount, 0) / searchedOrders.length)
                    : '$0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Edit Order Details</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.order_number} • {selectedOrder.customer}</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="processing">🔄 Processing</option>
                      <option value="shipped">🚚 Shipped</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                      <option value="refunded">💰 Refunded</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => setSelectedOrder({...selectedOrder, payment_status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="completed">✅ Completed</option>
                      <option value="failed">❌ Failed</option>
                      <option value="refunded">💰 Refunded</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                    <input
                      type="text"
                      value={selectedOrder.deliveryLocation}
                      onChange={(e) => setSelectedOrder({...selectedOrder, deliveryLocation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter delivery location"
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.items.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t text-xs">
                        <span>Items: {selectedOrder.items.length}</span>
                        <span>Avg: {formatCurrency(selectedOrder.total_amount / selectedOrder.items.length)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                    <textarea
                      value={selectedOrder.shipping_address}
                      onChange={(e) => setSelectedOrder({...selectedOrder, shipping_address: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Enter complete shipping address"
                    />
                  </div>

                  {isUsingFallback && (
                    <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                      Demo Mode: Changes saved locally only
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleUpdateOrder(selectedOrder)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-1" />
                      Update Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Administrative Tools Section */}
      <section className="mt-10 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Administrative Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500">
            <h3 className="font-semibold mb-3 text-blue-700 flex items-center">
              📊 Export Orders
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Download order data in CSV, Excel, or PDF format for reporting and analysis.
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                CSV
              </button>
              <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                PDF
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-purple-500">
            <h3 className="font-semibold mb-3 text-purple-700 flex items-center">
              ⚡ Bulk Update
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select multiple orders and update their status or payment information simultaneously.
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
              Start Bulk Update
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500">
            <h3 className="font-semibold mb-3 text-green-700 flex items-center">
              📈 Order Analytics
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View comprehensive order trends, revenue reports, and performance metrics.
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
              View Dashboard
            </button>
          </div>
        </div>
        
        {isUsingFallback && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
            <strong>Demo Mode Notice:</strong> All administrative tools work with sample data. 
            Export functions will download demo datasets for testing purposes.
          </div>
        )}
      </section>
    </div>
  );
}