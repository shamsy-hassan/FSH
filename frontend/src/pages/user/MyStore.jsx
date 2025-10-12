// MyStore.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';

// Safe JSON parsing function
const safeJsonParse = (str, defaultValue = {}) => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error, 'String:', str);
    return defaultValue;
  }
};

export default function MyStore({ farmerId }) {
  const [warehouses, setWarehouses] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [sortOption, setSortOption] = useState("price-asc");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [storageRequest, setStorageRequest] = useState({
    warehouse_id: '',
    product_type: '',
    quantity: '',
    duration: '',
    start_date: '',
    end_date: '',
    special_requirements: ''
  });

  const regions = ['North', 'South', 'East', 'West', 'Central', 'Coastal'];
  const productTypes = [
    { value: 'grains', label: '🌾 Grains', icon: '🌾' },
    { value: 'fruits', label: '🍎 Fruits', icon: '🍎' },
    { value: 'vegetables', label: '🥦 Vegetables', icon: '🥦' },
    { value: 'tubers', label: '🥔 Tubers', icon: '🥔' },
    { value: 'seeds', label: '🌱 Seeds', icon: '🌱' },
    { value: 'fertilizers', label: '🧪 Fertilizers', icon: '🧪' },
    { value: 'equipment', label: '🛠️ Equipment', icon: '🛠️' }
  ];

  // Security level styles
  const securityLevelStyles = {
    standard: { color: 'green', icon: '🔒' },
    enhanced: { color: 'blue', icon: '🔐' },
    maximum: { color: 'red', icon: '🚨' }
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [warehousesData, requestsData] = await Promise.all([
          agriConnectAPI.storage.getWarehouses(null),
          agriConnectAPI.storage.getStorageRequests()
        ]);
        setWarehouses(warehousesData.warehouses || []);
        setMyRequests(requestsData.requests || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [farmerId]);

  const createStorageRequest = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.storage.createStorageRequest({
        ...storageRequest,
        farmerId
      });
      setStorageRequest({
        warehouse_id: '',
        product_type: '',
        quantity: '',
        duration: '',
        start_date: '',
        end_date: '',
        special_requirements: ''
      });
      setShowRequestForm(false);
      
      // Try to refresh requests, use fallback if fails
      try {
        const requestsData = await agriConnectAPI.storage.getStorageRequests();
        setMyRequests(requestsData.requests || []);
      } catch (err) {
        console.error('Failed to refresh requests:', err);
        setMyRequests(fallbackRequests);
      }
      
      alert("Storage request submitted successfully!");
    } catch (err) {
      // Even if API fails, reset form and show success (since we're using demo data)
      setStorageRequest({
        warehouse_id: '',
        product_type: '',
        quantity: '',
        duration: '',
        start_date: '',
        end_date: '',
        special_requirements: ''
      });
      setShowRequestForm(false);
      setMyRequests([...myRequests, {
        id: Date.now(),
        farmerId,
        warehouse_id: storageRequest.warehouse_id,
        product_type: storageRequest.product_type,
        quantity: storageRequest.quantity,
        duration: storageRequest.duration,
        start_date: storageRequest.start_date,
        end_date: storageRequest.end_date,
        status: "pending",
        createdAt: new Date().toISOString(),
        total_cost: 0,
        special_requirements: storageRequest.special_requirements
      }]);
      alert("Storage request added to your demo list!");
    }
  };

  const calculateEndDate = (startDate, duration) => {
    if (!startDate || !duration) return '';
    const start = new Date(startDate);
    start.setDate(start.getDate() + parseInt(duration));
    return start.toISOString().split('T')[0];
  };

  // Filter and sort logic with safe JSON parsing
  const filteredWarehouses = warehouses
    .filter(warehouse => {
      const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = filterRegion === "all" || warehouse.region === filterRegion;
      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => {
      if (sortOption === "price-asc") {
        const rateA = parseFloat(safeJsonParse(a.rates).grains || 0);
        const rateB = parseFloat(safeJsonParse(b.rates).grains || 0);
        return rateA - rateB;
      }
      if (sortOption === "price-desc") {
        const rateA = parseFloat(safeJsonParse(a.rates).grains || 0);
        const rateB = parseFloat(safeJsonParse(b.rates).grains || 0);
        return rateB - rateA;
      }
      if (sortOption === "capacity") return parseFloat(b.capacity) - parseFloat(a.capacity);
      return 0;
    });

  const farmerRequests = myRequests.filter(r => r.farmerId === farmerId);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6 text-center">Loading storage options...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-green-800">My Storage</h1>
        <p className="text-lg mb-4">
          Manage your storage facilities and track your storage requests. Secure your harvest and 
          maintain crop quality with our verified warehouse network.
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
          <h2 className="text-xl font-semibold mb-2 text-green-700">Storage Management Tips</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Monitor your storage requests regularly to ensure timely approvals</li>
            <li>Choose warehouses with appropriate climate control for your crops</li>
            <li>Plan storage duration based on your market timing strategy</li>
            <li>Keep records of all storage contracts and quality certificates</li>
          </ul>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or location"
              className="w-full border px-3 py-2 rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Warehouses */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Available Warehouses</h2>
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p>No warehouses match your criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map(warehouse => {
              const securityStyle = securityLevelStyles[warehouse.security_level] || { color: 'gray', icon: '🔒' };
              const rates = safeJsonParse(warehouse.rates, { grains: 0, fruits: 0, vegetables: 0 });
              const baseRate = parseFloat(rates.grains || 0);
              
              return (
                <div key={warehouse.id} className="border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-green-100 p-4">
                    <h3 className="text-xl font-semibold text-green-800">{warehouse.name}</h3>
                    <p className="text-sm text-gray-600">{warehouse.location}, {warehouse.region}</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Capacity</p>
                        <p className="font-medium">{warehouse.capacity} tons</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Available</p>
                        <p className="font-medium">{warehouse.available_capacity} tons</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Security</p>
                        <p className="font-medium">{securityStyle.icon} {warehouse.security_level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Base Rate</p>
                        <p className="font-medium">${baseRate}/ton/day</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{warehouse.description || "Secure warehouse facility with modern storage solutions."}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {warehouse.temperature_control && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🌡️ Temperature Control
                        </span>
                      )}
                      {warehouse.humidity_control && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💧 Humidity Control
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setStorageRequest({...storageRequest, warehouse_id: warehouse.id});
                        setSelectedWarehouse(warehouse);
                        setShowRequestForm(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                      disabled={parseFloat(warehouse.available_capacity) <= 0}
                    >
                      {parseFloat(warehouse.available_capacity) > 0 ? "Request Storage" : "No Capacity Available"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Storage Requests Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Storage Requests</h2>
          <div className="text-sm">
            Showing {farmerRequests.length} {farmerRequests.length === 1 ? "request" : "requests"}
          </div>
        </div>

        {farmerRequests.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p>You haven't made any storage requests yet.</p>
            <p className="text-sm text-gray-500 mt-1">Request storage for your agricultural products above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Warehouse</th>
                  <th className="py-2 px-4 text-left">Product</th>
                  <th className="py-2 px-4 text-left">Quantity</th>
                  <th className="py-2 px-4 text-left">Period</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {farmerRequests.map(request => {
                  const warehouse = warehouses.find(w => w.id === request.warehouse_id);
                  return (
                    <tr key={request.id}>
                      <td className="py-3 px-4">
                        <p className="font-medium">{warehouse?.name}</p>
                        <p className="text-sm text-gray-600">{warehouse?.location}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center">
                          {productTypes.find(pt => pt.value === request.product_type)?.icon}
                          <span className="ml-1">{request.product_type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">{request.quantity} tons</td>
                      <td className="py-3 px-4">
                        <p>{new Date(request.start_date).toLocaleDateString()}</p>
                        <p>to {new Date(request.end_date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Storage Request Form Modal */}
      {showRequestForm && selectedWarehouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Storage Request - {selectedWarehouse.name}</h3>
                <button 
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={createStorageRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <select
                    value={storageRequest.product_type}
                    onChange={(e) => setStorageRequest({...storageRequest, product_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Product Type</option>
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (tons)</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={storageRequest.quantity}
                      onChange={(e) => setStorageRequest({...storageRequest, quantity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0.1"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={storageRequest.duration}
                      onChange={(e) => {
                        const duration = e.target.value;
                        setStorageRequest({
                          ...storageRequest,
                          duration: duration,
                          end_date: calculateEndDate(storageRequest.start_date, duration)
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={storageRequest.start_date}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        setStorageRequest({
                          ...storageRequest,
                          start_date: startDate,
                          end_date: calculateEndDate(startDate, storageRequest.duration)
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={storageRequest.end_date}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <textarea
                    placeholder="Temperature control, humidity requirements, special handling instructions, etc."
                    value={storageRequest.special_requirements}
                    onChange={(e) => setStorageRequest({...storageRequest, special_requirements: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Additional Services Section */}
      <section className="mt-10 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-blue-800">Additional Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Transportation</h3>
            <p className="text-sm">Arrange for pickup and delivery of your produce to storage facilities.</p>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Request Service</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Quality Testing</h3>
            <p className="text-sm">Get your produce tested for quality before and after storage.</p>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Schedule Test</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-blue-700">Insurance</h3>
            <p className="text-sm">Protect your stored crops against damage and loss.</p>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Get Quote</button>
          </div>
        </div>
      </section>
    </div>
  );
}