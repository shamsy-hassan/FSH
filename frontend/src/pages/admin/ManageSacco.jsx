// ManageSacco.jsx
import React, { useState, useEffect } from 'react';
import { agriConnectAPI } from '../../services/api';

function ManageSacco() {
  const [saccos, setSaccos] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSacco, setSelectedSacco] = useState(null);
  const [showLoanApplications, setShowLoanApplications] = useState(false);
  const [saccoDetails, setSaccoDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [showCreateSaccoModal, setShowCreateSaccoModal] = useState(false);
  const [isCreatingSacco, setIsCreatingSacco] = useState(false);

  const regions = ['North', 'South', 'East', 'West', 'Central'];
  
  // SACCO Creation Form State
  const [newSacco, setNewSacco] = useState({
    name: '',
    description: '',
    region: '',
    location: '',
    registration_number: '',
    founded_date: '',
    total_members: 0,
    total_assets: 0,
    contact_email: '',
    contact_phone: '',
    address: '',
    is_active: true,
    logo: null
  });

  useEffect(() => {
    fetchSaccos();
  }, [selectedRegion]);

  const fetchSaccos = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.sacco.getSaccos(selectedRegion || null);
      setSaccos(data.saccos || []);
    } catch (err) {
      setError('Failed to fetch SACCOs');
      console.error('Error fetching SACCOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSacco = async (e) => {
    e.preventDefault();
    setIsCreatingSacco(true);
    
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      Object.keys(newSacco).forEach(key => {
        if (key === 'logo' && newSacco[key]) {
          formData.append('logo', newSacco[key]);
        } else if (newSacco[key] !== '') {
          formData.append(key, newSacco[key]);
        }
      });

      const response = await agriConnectAPI.sacco.createSacco(formData);
      
      // Reset form
      setNewSacco({
        name: '',
        description: '',
        region: '',
        location: '',
        registration_number: '',
        founded_date: '',
        total_members: 0,
        total_assets: 0,
        contact_email: '',
        contact_phone: '',
        address: '',
        is_active: true,
        logo: null
      });
      
      setSuccess('SACCO created successfully! It will be visible to users within 5 minutes.');
      setShowCreateSaccoModal(false);
      fetchSaccos(); // Refresh the list
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (err) {
      setError('Failed to create SACCO. Please check your input and try again.');
      console.error('Error creating SACCO:', err);
    } finally {
      setIsCreatingSacco(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Logo file size must be less than 5MB');
      return;
    }
    if (file && !file.type.startsWith('image/')) {
      setError('Please upload a valid image file for the logo');
      return;
    }
    setNewSacco(prev => ({ ...prev, logo: file }));
  };

  const fetchLoanApplications = async (saccoId) => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.sacco.getLoanApplications(saccoId);
      setLoanApplications(data.applications || []);
      setSelectedSacco(saccoId);
      
      // Get SACCO details for display
      const sacco = saccos.find(s => s.id === saccoId);
      setSaccoDetails(sacco);
      
      setShowLoanApplications(true);
      setStatusFilter('pending'); // Default to pending applications
    } catch (err) {
      setError('Failed to fetch loan applications');
      console.error('Error fetching loan applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLoanApplicationStatus = async (applicationId, newStatus) => {
    try {
      await agriConnectAPI.sacco.updateLoanStatus(applicationId, { status: newStatus });
      setError(null);
      
      // Show success message
      setSuccess(`Loan application ${newStatus} successfully!`);
      
      // Refresh the applications list
      const data = await agriConnectAPI.sacco.getLoanApplications(selectedSacco);
      setLoanApplications(data.applications || []);
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update application status');
      console.error('Error updating application:', err);
    }
  };

  const deactivateSacco = async (saccoId) => {
    if (!window.confirm('Are you sure you want to deactivate this SACCO? This will make it unavailable to new members.')) return;
    
    try {
      await agriConnectAPI.sacco.deactivateSacco(saccoId);
      setSuccess('SACCO deactivated successfully');
      fetchSaccos(); // Refresh the list
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to deactivate SACCO');
      console.error('Error deactivating SACCO:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      disbursed: "bg-green-100 text-green-700",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-700";
  };

  const renderCreateSaccoModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Create New SACCO</h3>
              <p className="text-gray-600 mt-1">Set up a new Savings and Credit Cooperative for farmers</p>
            </div>
            <button 
              onClick={() => {
                setShowCreateSaccoModal(false);
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-2 -m-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleCreateSacco} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SACCO Name *</label>
                <input
                  type="text"
                  placeholder="Enter SACCO name (e.g., Green Valley Farmers SACCO)"
                  value={newSacco.name}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                <select
                  value={newSacco.region}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  placeholder="City/Town (e.g., Nakuru, Eldoret)"
                  value={newSacco.location}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                <input
                  type="text"
                  placeholder="SACCO/REG/2024/001"
                  value={newSacco.registration_number}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, registration_number: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Description and Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  placeholder="Describe the SACCO's focus, target members, and services (max 500 characters)"
                  value={newSacco.description}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newSacco.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Founded Date *</label>
                <input
                  type="date"
                  value={newSacco.founded_date}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, founded_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                <input
                  type="email"
                  placeholder="sacco@example.com"
                  value={newSacco.contact_email}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                <input
                  type="tel"
                  placeholder="+254 700 123 456"
                  value={newSacco.contact_phone}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-4">💰 Financial Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Initial Members</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newSacco.total_members}
                    onChange={(e) => setNewSacco(prev => ({ ...prev, total_members: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-1">Number of founding members</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Initial Assets (KSh)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newSacco.total_assets}
                    onChange={(e) => setNewSacco(prev => ({ ...prev, total_assets: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-1">Starting capital and assets</p>
                </div>
              </div>
            </div>

            {/* Address and Logo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Physical Address</label>
                <textarea
                  placeholder="Full address including street, city, postal code"
                  value={newSacco.address}
                  onChange={(e) => setNewSacco(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SACCO Logo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Max 5MB. Recommended size: 300x300px</p>
                {newSacco.logo && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(newSacco.logo)} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status and Terms */}
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="is_active"
                checked={newSacco.is_active}
                onChange={(e) => setNewSacco(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Make SACCO active and visible to users immediately
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p>Once created, this SACCO will be visible to all farmers in the selected region.</p>
                  <p className="mt-1">New members can join immediately if set to active status.</p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateSaccoModal(false);
                  setError(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                disabled={isCreatingSacco}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isCreatingSacco || !newSacco.name || !newSacco.region}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreatingSacco ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating SACCO...
                  </>
                ) : (
                  'Create SACCO'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderLoanApplications = () => {
    const filteredLoans = loanApplications
      .filter((loan) => loan.status === statusFilter)
      .sort((a, b) => new Date(b.application_date) - new Date(a.application_date));

    return (
      <div className="py-14 px-4 md:px-6 2xl:px-20 2xl:container 2xl:mx-auto min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-semibold leading-7 lg:leading-9 text-gray-800">
            💰 Loan Requests - {saccoDetails?.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total: {loanApplications.length} | {statusFilter}: {filteredLoans.length}
            </span>
            <button
              onClick={() => {
                setShowLoanApplications(false);
                setStatusFilter('pending');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to SACCOs
            </button>
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="pending">Pending ({loanApplications.filter(l => l.status === 'pending').length})</option>
            <option value="approved">Approved ({loanApplications.filter(l => l.status === 'approved').length})</option>
            <option value="rejected">Rejected ({loanApplications.filter(l => l.status === 'rejected').length})</option>
            <option value="disbursed">Disbursed ({loanApplications.filter(l => l.status === 'disbursed').length})</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading loan requests...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center text-gray-500 italic">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No loan applications found</p>
            <p className="text-sm mt-1">This SACCO doesn't have any {statusFilter} applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
            {filteredLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white p-6 border border-gray-200 rounded-lg shadow-md flex flex-col space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Application #{loan.id}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                      getStatusBadgeClass(loan.status)
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>

                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Farmer:</span> {loan.farmer_name || loan.user_name || "N/A"}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Date:</span> {loan.application_date || loan.date || "N/A"}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Amount:</span> KSh {loan.amount?.toLocaleString() || "N/A"}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01" />
                    </svg>
                    <span className="font-medium">Purpose:</span> {loan.purpose || "N/A"}
                  </div>
                  {loan.collateral && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-medium">Collateral:</span> {loan.collateral}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <p className="text-base font-semibold text-gray-800">
                      Status: 
                      <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                        getStatusBadgeClass(loan.status)
                      }`}>
                        {loan.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {loan.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateLoanApplicationStatus(loan.id, "approved")}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateLoanApplicationStatus(loan.id, "rejected")}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {loan.status === "approved" && (
                      <button
                        onClick={() => updateLoanApplicationStatus(loan.id, "disbursed")}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                      >
                        Mark Disbursed
                      </button>
                    )}

                    {(loan.status === "rejected" || loan.status === "disbursed") && (
                      <span className="text-gray-500 italic text-sm">
                        No actions available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading && !showLoanApplications) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading SACCO data...</span>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Manage SACCOs</h1>
        <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
          Create, manage, and monitor Savings and Credit Cooperatives for farmers across Kenya
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 ${
          error.includes('updated') ? 'animate-pulse' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showLoanApplications ? (
        renderLoanApplications()
      ) : (
        <>
          {/* Action Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">SACCO Management</h2>
                <p className="text-gray-600">Manage existing SACCOs and create new ones for farmers</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCreateSaccoModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New SACCO
                </button>
                
                <div className="flex-1 max-w-xs">
                  <div className="flex">
                    <select 
                      value={selectedRegion} 
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Regions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    <button 
                      onClick={fetchSaccos}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SACCOs List View */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Active SACCOs</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {saccos.filter(s => s.is_active).length} Active | {saccos.length} Total
              </span>
            </div>
            
            {saccos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SACCOs Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first SACCO</p>
                <button
                  onClick={() => setShowCreateSaccoModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create First SACCO
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {saccos.map(sacco => (
                  <div key={sacco.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    {sacco.logo && (
                      <div className="flex items-center mb-4">
                        <img 
                          src={sacco.logo} 
                          alt={`${sacco.name} logo`} 
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-semibold text-gray-800 truncate">{sacco.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{sacco.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {!sacco.logo && (
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-white font-semibold text-sm">
                            {sacco.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-semibold text-gray-800 truncate">{sacco.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{sacco.description}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{sacco.region}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{sacco.location}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{sacco.total_members.toLocaleString()} members</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>KSh {sacco.total_assets?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{sacco.founded_date}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{sacco.registration_number}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          sacco.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sacco.is_active ? 'Active & Visible' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">
                        Last updated: {new Date().toLocaleDateString()} | 
                        {sacco.is_active && (
                          <span className="ml-2 text-green-600 font-medium">
                            Visible to {sacco.region} farmers
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchLoanApplications(sacco.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          View Applications ({sacco.pending_applications || 0})
                        </button>
                        
                        <button
                          onClick={() => deactivateSacco(sacco.id)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            sacco.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!sacco.is_active}
                        >
                          {sacco.is_active ? 'Deactivate' : 'Inactive'}
                        </button>
                        
                        <button
                          onClick={() => {
                            // Edit functionality would go here
                            console.log('Edit SACCO:', sacco.id);
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                          title="Edit SACCO details"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create SACCO Modal */}
      {showCreateSaccoModal && renderCreateSaccoModal()}
    </div>
  );
}

export default ManageSacco;