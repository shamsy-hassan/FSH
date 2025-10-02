// ManageStore.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';

export default function ManageStore() {
  const [warehouses, setWarehouses] = useState([]);
  const [storageRequests, setStorageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [sortOption, setSortOption] = useState("capacity");
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);

  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    location: '',
    region: '',
    capacity: '',
    available_capacity: '',
    temperature_control: false,
    humidity_control: false,
    security_level: 'standard',
    owner: '',
    contact_info: '',
    rates: '{}',
    description: ''
  });

  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const securityLevels = ['standard', 'enhanced', 'maximum'];

  // Security level styles
  const securityLevelStyles = {
    standard: { color: 'green', icon: '🔒' },
    enhanced: { color: 'blue', icon: '🔐' },
    maximum: { color: 'red', icon: '🚨' }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.storage.getWarehouses(null);
      setWarehouses(data.warehouses || []);
    } catch (err) {
      setError('Failed to fetch warehouses');
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageRequests = async (warehouseId) => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.storage.getStorageRequests(warehouseId);
      setStorageRequests(data.requests || []);
      setSelectedWarehouse(warehouseId);
      setShowRequests(true);
    } catch (err) {
      setError('Failed to fetch storage requests');
      console.error('Error fetching storage requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStorageRequests = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.storage.getStorageRequests(); // No warehouseId = all requests
      setStorageRequests(data.requests || []);
      setSelectedWarehouse(null); // No specific warehouse selected
      setShowRequests(true);
    } catch (err) {
      setError('Failed to fetch all storage requests');
      console.error('Error fetching all storage requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await agriConnectAPI.storage.updateStorageRequestStatus(requestId, newStatus);
      if (selectedWarehouse) {
        const data = await agriConnectAPI.storage.getStorageRequests(selectedWarehouse);
        setStorageRequests(data.requests || []);
      }
      setError(null);
    } catch (err) {
      setError('Failed to update request status');
      console.error('Error updating request:', err);
    }
  };

  const createWarehouse = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.storage.createWarehouse(newWarehouse);
      setShowWarehouseForm(false);
      setNewWarehouse({
        name: '',
        location: '',
        region: '',
        capacity: '',
        available_capacity: '',
        temperature_control: false,
        humidity_control: false,
        security_level: 'standard',
        owner: '',
        contact_info: '',
        rates: '{}',
        description: ''
      });
      fetchWarehouses(); // Refresh list
      setError(null);
      alert("Warehouse created successfully!");
    } catch (err) {
      setError('Failed to create warehouse');
      console.error('Error creating warehouse:', err);
    }
  };

  const toggleWarehouseStatus = async (warehouseId, currentStatus) => {
    try {
      await agriConnectAPI.storage.updateWarehouseStatus(warehouseId, !currentStatus);
      fetchWarehouses(); // Refresh list
    } catch (err) {
      setError('Failed to update warehouse status');
      console.error('Error updating warehouse:', err);
    }
  };

  // Filter and sort logic
  const filteredWarehouses = warehouses
    .filter(warehouse => {
      const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = filterRegion === "all" || warehouse.region === filterRegion;
      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => {
      if (sortOption === "capacity") return parseFloat(b.capacity) - parseFloat(a.capacity);
      if (sortOption === "availability") return parseFloat(b.available_capacity) - parseFloat(a.available_capacity);
      return 0;
    });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !showRequests) return <div className="p-6 text-center">Loading storage facilities...</div>;
  if (error && !showRequests) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-green-800">Manage Storage Facilities</h1>
        <p className="text-lg mb-4">
          Administer your storage network, manage warehouse operations, and process farmer storage requests efficiently.
        </p>
        
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2 text-green-700">Management Best Practices</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regularly update warehouse availability and capacity information</li>
            <li>Process storage requests within 24 hours to maintain farmer satisfaction</li>
            <li>Monitor warehouse utilization rates to optimize operations</li>
            <li>Ensure all climate control systems are functioning properly</li>
          </ul>
        </div>
      </div>

      {/* Search and Filter Section */}
      {!showRequests && (
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
                <option value="capacity">Total Capacity</option>
                <option value="availability">Available Capacity</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showRequests ? (
        /* Storage Requests View */
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setShowRequests(false)}
              className="flex items-center text-green-600 hover:text-green-800 mb-6 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Warehouses
            </button>
            <h2 className="text-2xl font-bold">
              {selectedWarehouse ? 'Storage Requests for Warehouse' : 'All Storage Requests'}
            </h2>
          </div>
          
          {storageRequests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <p>No storage requests found{selectedWarehouse ? ' for this warehouse' : ''}.</p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedWarehouse 
                  ? "This warehouse doesn't have any pending storage requests yet."
                  : "No storage requests have been submitted to any warehouse yet."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="py-2 px-4 text-left">Farmer</th>
                    {!selectedWarehouse && <th className="py-2 px-4 text-left">Warehouse</th>}
                    <th className="py-2 px-4 text-left">Product</th>
                    <th className="py-2 px-4 text-left">Quantity</th>
                    <th className="py-2 px-4 text-left">Duration</th>
                    <th className="py-2 px-4 text-left">Period</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {storageRequests.map(request => (
                    <tr key={request.id} className={`${request.status === 'rejected' ? 'bg-gray-50' : ''}`}>
                      <td className="py-3 px-4">
                        <p className="font-medium">Farmer #{request.farmerId}</p>
                        <p className="text-sm text-gray-600">{request.createdAt && new Date(request.createdAt).toLocaleDateString()}</p>
                      </td>
                      {!selectedWarehouse && (
                        <td className="py-3 px-4">
                          <p className="font-medium">{request.warehouse_name || 'Unknown Warehouse'}</p>
                          <p className="text-sm text-gray-600">ID: {request.warehouse_id}</p>
                        </td>
                      )}
                      <td className="py-3 px-4">{request.product_type}</td>
                      <td className="py-3 px-4">{request.quantity} tons</td>
                      <td className="py-3 px-4">{request.duration} days</td>
                      <td className="py-3 px-4">
                        <p>{new Date(request.start_date).toLocaleDateString()}</p>
                        <p>to {new Date(request.end_date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={request.status}
                          onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        /* Warehouses List View */
        <>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              {error}
              <button 
                onClick={() => setError(null)}
                className="float-right text-red-800 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Warehouse Facilities</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{filteredWarehouses.length} facilities</span>
                <button 
                  onClick={fetchWarehouses}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Refresh
                </button>
                <button 
                  onClick={fetchAllStorageRequests}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  View All Requests
                </button>
                <button 
                  onClick={() => setShowWarehouseForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Warehouse
                </button>
              </div>
            </div>

            {filteredWarehouses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded">
                <p>No warehouses found matching your criteria.</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or add a new warehouse.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map(warehouse => {
                  const securityStyle = securityLevelStyles[warehouse.security_level] || { color: 'gray', icon: '🔒' };
                  
                  return (
                    <div key={warehouse.id} className="border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-green-100 p-4">
                        <h3 className="text-xl font-semibold text-green-800">{warehouse.name}</h3>
                        <p className="text-sm text-gray-600">{warehouse.location}, {warehouse.region}</p>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Total Capacity</p>
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
                            <p className="text-sm text-gray-500">Status</p>
                            <p className={`font-medium ${
                              warehouse.is_active ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {warehouse.is_active ? 'Active' : 'Inactive'}
                            </p>
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
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchStorageRequests(warehouse.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            View Requests ({storageRequests.filter(r => r.warehouse_id === warehouse.id).length})
                          </button>
                          
                          <button
                            onClick={() => toggleWarehouseStatus(warehouse.id, warehouse.is_active)}
                            className={`px-3 py-2 rounded text-sm transition-colors ${
                              warehouse.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {warehouse.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Add Warehouse Form Modal */}
      {showWarehouseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-green-800">Add New Warehouse</h3>
                <button 
                  onClick={() => setShowWarehouseForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={createWarehouse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name</label>
                    <input
                      type="text"
                      placeholder="Enter warehouse name"
                      value={newWarehouse.name}
                      onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      value={newWarehouse.region}
                      onChange={(e) => setNewWarehouse({...newWarehouse, region: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Region</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Enter full address"
                    value={newWarehouse.location}
                    onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity (tons)</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={newWarehouse.capacity}
                      onChange={(e) => setNewWarehouse({...newWarehouse, capacity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Capacity (tons)</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newWarehouse.available_capacity}
                      onChange={(e) => setNewWarehouse({...newWarehouse, available_capacity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Level</label>
                    <select
                      value={newWarehouse.security_level}
                      onChange={(e) => setNewWarehouse({...newWarehouse, security_level: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {securityLevels.map(level => {
                        const style = securityLevelStyles[level] || { color: 'gray', icon: '🔒' };
                        return (
                          <option key={level} value={level}>
                            {style.icon} {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <input
                      type="text"
                      placeholder="Owner name"
                      value={newWarehouse.owner}
                      onChange={(e) => setNewWarehouse({...newWarehouse, owner: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Brief description of the warehouse facilities and services"
                    value={newWarehouse.description}
                    onChange={(e) => setNewWarehouse({...newWarehouse, description: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newWarehouse.temperature_control}
                      onChange={(e) => setNewWarehouse({...newWarehouse, temperature_control: e.target.checked})}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Temperature Control</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newWarehouse.humidity_control}
                      onChange={(e) => setNewWarehouse({...newWarehouse, humidity_control: e.target.checked})}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Humidity Control</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
                    <input
                      type="text"
                      placeholder="Phone or email"
                      value={newWarehouse.contact_info}
                      onChange={(e) => setNewWarehouse({...newWarehouse, contact_info: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Rates (JSON)</label>
                    <textarea
                      placeholder='{"grains": 10, "fruits": 15, "vegetables": 12}'
                      value={newWarehouse.rates}
                      onChange={(e) => setNewWarehouse({...newWarehouse, rates: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowWarehouseForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Warehouse
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Additional Services Section */}
      {!showRequests && (
        <section className="mt-10 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3 text-blue-800">Administrative Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2 text-blue-700">Reports</h3>
              <p className="text-sm">Generate utilization reports and performance analytics.</p>
              <button className="mt-2 text-sm text-blue-600 hover:underline">Generate Report</button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2 text-blue-700">Maintenance</h3>
              <p className="text-sm">Schedule and track warehouse maintenance activities.</p>
              <button className="mt-2 text-sm text-blue-600 hover:underline">Schedule Maintenance</button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2 text-blue-700">Compliance</h3>
              <p className="text-sm">Manage certifications and regulatory compliance.</p>
              <button className="mt-2 text-sm text-blue-600 hover:underline">View Compliance</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}