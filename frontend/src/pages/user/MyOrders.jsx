// MyOrders.jsx
import { useEffect, useState } from "react";
import { agriConnectAPI } from "../../services/api";
import { FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';

export default function MyOrders({ farmerId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fallback sample data
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
          product: { name: "Maize Seeds - 50kg" },
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
          product: { name: "DAP Fertilizer - 50kg" },
          quantity: 4,
          price: 800,
          subtotal: 3200
        }
      ]
    },
    {
      id: 3,
      order_number: "#ORD-003",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 1800,
      status: "processing",
      payment_status: "completed",
      deliveryLocation: "Kisii, Kenya",
      deliveryDate: "2025-09-30",
      shipping_address: "Ogembo Market, Kisii\nKisii County, Kenya\nPhone: +254 722 456 789",
      items: [
        {
          id: 3,
          product_id: 3,
          product: { name: "Hybrid Tomato Seeds" },
          quantity: 1,
          price: 1800,
          subtotal: 1800
        }
      ]
    }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await agriConnectAPI.order.getOrders(statusFilter, page, 10);
        setOrders(response.orders || []);
        setTotalPages(response.pages || 1);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        // Set fallback data instead of showing error
        setOrders(fallbackOrders.filter(order => 
          statusFilter === "all" || order.status === statusFilter
        ));
        setTotalPages(1);
        setError("Using demo data - connection temporarily unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, page]);

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

  // Filter orders for pagination with fallback data
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const paginatedOrders = filteredOrders.slice((page - 1) * 10, page * 10);

  if (loading) {
    return (
      <div className="p-6 text-center">Loading orders...</div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-green-800">📦 My Orders</h1>
        <p className="text-lg mb-4">
          Track your agricultural inputs orders, monitor delivery status, and manage your purchases.
        </p>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2 text-green-700">Order Management Tips</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Track your orders regularly to ensure timely delivery of agricultural inputs</li>
            <li>Verify delivery addresses before confirming your orders</li>
            <li>Contact support immediately if you notice any delivery issues</li>
            <li>Keep records of all receipts and delivery confirmations</li>
          </ul>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {paginatedOrders.length} of {filteredOrders.length} orders
          </div>
        </div>
      </div>

      {/* Orders List */}
      {paginatedOrders.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">You haven't placed any orders yet.</p>
          </div>
          <a 
            href="/farmer-dashboard/purchase" 
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          {paginatedOrders.map(order => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <span
                      className={`px-4 py-2 text-sm font-medium rounded-full capitalize flex items-center ${
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
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{order.deliveryLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span className="font-medium">{order.deliveryDate || "TBD"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="font-medium">
                        {order.payment_status === "completed" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Shipping Address:</span>
                      <span className="font-medium text-xs break-words max-w-xs">
                        {order.shipping_address?.split('\n')[0] || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Order Summary</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <tr key={`${item.id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.product?.name || `Product #${item.product_id}`}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Order Total
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(order.total_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  {order.status === "pending" && (
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                      Contact Support
                    </button>
                  )}
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Additional Services Section */}
      <section className="mt-10 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-blue-800">Order Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Track Delivery</h3>
            <p className="text-sm mb-2">Real-time tracking for all your agricultural inputs.</p>
            <button className="text-sm text-blue-600 hover:underline">Track Now</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Returns</h3>
            <p className="text-sm mb-2">Easy returns within 7 days for quality issues.</p>
            <button className="text-sm text-blue-600 hover:underline">Request Return</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Support</h3>
            <p className="text-sm mb-2">24/7 customer support for order assistance.</p>
            <button className="text-sm text-blue-600 hover:underline">Contact Support</button>
          </div>
        </div>
      </section>
    </div>
  );
}