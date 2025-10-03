import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';

function ManageSacco() {
  const [saccos, setSaccos] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSacco, setSelectedSacco] = useState(null);
  const [showLoanApplications, setShowLoanApplications] = useState(false);
  const [showAllLoans, setShowAllLoans] = useState(false);
  const [saccoDetails, setSaccoDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');
  const [showCreateSaccoModal, setShowCreateSaccoModal] = useState(false);
  const [isCreatingSacco, setIsCreatingSacco] = useState(false);
  const [showEditSaccoModal, setShowEditSaccoModal] = useState(false);
  const [editingSacco, setEditingSacco] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [saccoMembers, setSaccoMembers] = useState([]);
  const [currentSaccoId, setCurrentSaccoId] = useState(null);

  const regions = ['North', 'South', 'East', 'West', 'Central'];

  // SACCO Creation/Edit Form State
  const [saccoForm, setSaccoForm] = useState({
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
    logo: null,
  });

  useEffect(() => {
    fetchSaccos();
  }, [selectedRegion]);

  // Fetch ALL loan applications for admin view (across all SACCOs)
  const fetchAllLoanApplications = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.sacco.getLoanApplications(); // Get all applications (no saccoId filter)
      setLoanApplications(data.applications || []);
      setShowLoanApplications(true);
      setStatusFilter('all'); // Show all statuses by default
    } catch (err) {
      setError('Failed to fetch loan applications');
      console.error('Error fetching loan applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ALL loans for admin view
  const fetchAllLoans = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.sacco.getLoans(); // Get all loans (no saccoId filter)
      setAllLoans(data.loans || []);
      setShowAllLoans(true);
    } catch (err) {
      setError('Failed to fetch loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateOrUpdateSacco = async (e) => {
    e.preventDefault();
    setIsCreatingSacco(true);
    setError(null); // Clear any previous errors

    try {
      const formData = new FormData();
      Object.keys(saccoForm).forEach((key) => {
        if (key === 'logo' && saccoForm[key]) {
          formData.append('logo', saccoForm[key]);
        } else if (saccoForm[key] !== '') {
          formData.append(key, saccoForm[key]);
        }
      });

      let response;
      if (editingSacco) {
        response = await agriConnectAPI.sacco.updateSacco(editingSacco.id, formData);
        setSuccess('SACCO updated successfully!');
      } else {
        response = await agriConnectAPI.sacco.createSacco(formData);
        setSuccess('SACCO created successfully! It will be visible to users within 5 minutes.');
      }

      // If we get here, the operation was successful
      resetForm();
      setShowCreateSaccoModal(false);
      setShowEditSaccoModal(false);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('SACCO operation error:', err);
      
      // Extract specific error message from the response
      let errorMessage;
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else {
        errorMessage = editingSacco ? 'Failed to update SACCO' : 'Failed to create SACCO. Please check your input and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsCreatingSacco(false);
    }

    // Refresh the SACCOs list separately to avoid showing error if SACCO creation succeeded
    try {
      await fetchSaccos();
    } catch (fetchError) {
      console.error('Error refreshing SACCOs list:', fetchError);
      // Don't show error to user for list refresh failure
    }
  };

  const resetForm = () => {
    setSaccoForm({
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
      logo: null,
    });
    setEditingSacco(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }
    if (file && !file.type.startsWith('image/')) {
      setError('Please upload a valid image file for the logo');
      return;
    }
    setSaccoForm((prev) => ({ ...prev, logo: file }));
  };

  const fetchLoanApplications = async (saccoId) => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.sacco.getLoanApplications(saccoId);
      setLoanApplications(data.applications || []);
      setSelectedSacco(saccoId);
      const sacco = saccos.find((s) => s.id === saccoId);
      setSaccoDetails(sacco);
      setShowLoanApplications(true);
      setStatusFilter('pending');
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
      setSuccess(`Loan application ${newStatus} successfully!`);

      // Refresh relevant views
      if (showAllLoans) {
        fetchAllLoans();
      }
      if (showLoanApplications) {
        const data = await agriConnectAPI.sacco.getLoanApplications(selectedSacco);
        setLoanApplications(data.applications || []);
      }

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
      fetchSaccos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to deactivate SACCO');
      console.error('Error deactivating SACCO:', err);
    }
  };

  const fetchSaccoMembers = async (saccoId) => {
    try {
      console.log('Fetching members for SACCO ID:', saccoId);
      const data = await agriConnectAPI.sacco.getSaccoMembers(saccoId);
      console.log('Members data received:', data);
      setSaccoMembers(data.members || []);
      setCurrentSaccoId(saccoId);
      setShowMembersModal(true);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to fetch SACCO members');
    }
  };

  const handleEditSacco = (sacco) => {
    setEditingSacco(sacco);
    setSaccoForm({
      name: sacco.name || '',
      description: sacco.description || '',
      region: sacco.region || '',
      location: sacco.location || '',
      registration_number: sacco.registration_number || '',
      founded_date: sacco.founded_date || '',
      total_members: sacco.total_members || 0,
      total_assets: sacco.total_assets || 0,
      contact_email: sacco.contact_email || '',
      contact_phone: sacco.contact_phone || '',
      address: sacco.address || '',
      is_active: sacco.is_active || true,
      logo: null,
    });
    setShowEditSaccoModal(true);
  };

  const getStatusBadgeClass = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      disbursed: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      processing: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  // Render ALL loans section for admin
  const renderAllLoans = () => {
    const filteredLoans = loanStatusFilter === 'all' ? allLoans : allLoans.filter((loan) => loan.status === loanStatusFilter);

    return (
      <div className="py-14 px-4 md:px-6 2xl:px-20 2xl:container 2xl:mx-auto min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-7 lg:leading-9 text-gray-800">
              📋 All Loan Applications
            </h1>
            <p className="text-gray-600 mt-2">Manage and review all loan applications across all SACCOs</p>
          </div>
          <button
            onClick={() => {
              setShowAllLoans(false);
              setLoanStatusFilter('all');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to SACCOs
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{allLoans.length}</div>
            <div className="text-sm text-gray-600">Total Loans</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">{allLoans.filter((l) => l.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{allLoans.filter((l) => l.status === 'approved').length}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{allLoans.filter((l) => l.status === 'rejected').length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex space-x-2 bg-gray-100 p-2 rounded-lg">
            {['all', 'pending', 'approved', 'rejected', 'disbursed', 'processing'].map((status) => (
              <button
                key={status}
                onClick={() => setLoanStatusFilter(status)}
                className={`px-4 py-2 rounded-md capitalize transition-colors text-sm ${
                  loanStatusFilter === status ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({status === 'all' ? allLoans.length : allLoans.filter((l) => l.status === status).length})
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredLoans.length} of {allLoans.length} loans
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading loans...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No loan applications found</p>
            <p className="text-sm mt-1">
              {loanStatusFilter === 'all' ? 'There are no loan applications in the system.' : `There are no ${loanStatusFilter} loans.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SACCO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{loan.id}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{loan.purpose}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.user_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{loan.user_phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.sacco_name}</div>
                        <div className="text-sm text-gray-500">{loan.sacco_region}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">KSh {loan.amount?.toLocaleString() || '0'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.period || 'N/A'} months</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(loan.application_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateLoanApplicationStatus(loan.id, 'approved')}
                                className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateLoanApplicationStatus(loan.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded text-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <button
                              onClick={() => updateLoanApplicationStatus(loan.id, 'disbursed')}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 px-3 py-1 rounded text-xs"
                            >
                              Mark Disbursed
                            </button>
                          )}
                          <button
                            onClick={() => {
                              console.log('View loan details:', loan.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded text-xs"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoanApplications = () => {
    const filteredLoans = loanApplications
      .filter((loan) => statusFilter === 'all' || loan.status === statusFilter)
      .sort((a, b) => new Date(b.application_date) - new Date(a.application_date));

    return (
      <div className="py-14 px-4 md:px-6 2xl:px-20 2xl:container 2xl:mx-auto min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-semibold leading-7 lg:leading-9 text-gray-800">
            💰 Loan Requests - {saccoDetails?.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total: {loanApplications.length} | {statusFilter === 'all' ? 'Showing All' : statusFilter}: {filteredLoans.length}
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
            <option value="all">All Applications ({loanApplications.length})</option>
            <option value="pending">Pending ({loanApplications.filter((l) => l.status === 'pending').length})</option>
            <option value="approved">Approved ({loanApplications.filter((l) => l.status === 'approved').length})</option>
            <option value="rejected">Rejected ({loanApplications.filter((l) => l.status === 'rejected').length})</option>
            <option value="disbursed">Disbursed ({loanApplications.filter((l) => l.status === 'disbursed').length})</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading loan requests...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center text-gray-500 italic">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No loan applications found</p>
            <p className="text-sm mt-1">
              {statusFilter === 'all' 
                ? 'This SACCO doesn\'t have any loan applications' 
                : `This SACCO doesn't have any ${statusFilter} applications`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
            {filteredLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white p-6 border border-gray-200 rounded-lg shadow-md flex flex-col space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {loan.username || 'Applicant'} 
                      <span className="text-sm text-gray-500 ml-2">#{loan.id}</span>
                    </h3>
                    <p className="text-sm text-blue-600 mb-1">{loan.email}</p>
                    <p className="text-sm text-gray-600 mb-2">{loan.purpose}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Applied: {new Date(loan.application_date).toLocaleDateString()}</span>
                      {loan.days_since_application !== null && (
                        <span>({loan.days_since_application} days ago)</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(loan.status)}`}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </span>
                </div>

                {/* Loan Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Amount:</span>
                    <p className="text-lg font-bold text-green-600">KSh {loan.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Period:</span>
                    <p className="text-gray-800">{loan.repayment_period_months || 'N/A'} months</p>
                  </div>
                  {loan.loan_type && (
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <p className="text-gray-800">{loan.loan_type}</p>
                    </div>
                  )}
                  {loan.interest_rate && (
                    <div>
                      <span className="font-medium text-gray-600">Interest Rate:</span>
                      <p className="text-gray-800">{loan.interest_rate}% APR</p>
                    </div>
                  )}
                </div>

                {/* Timeline Information */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Application Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Applied:</span>
                      <span>{new Date(loan.application_date).toLocaleDateString()}</span>
                    </div>
                    {loan.approval_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {loan.status === 'approved' ? 'Approved:' : 'Processed:'}
                        </span>
                        <span>
                          {new Date(loan.approval_date).toLocaleDateString()}
                          {loan.processing_days !== null && (
                            <span className="text-gray-500 ml-1">({loan.processing_days} days)</span>
                          )}
                        </span>
                      </div>
                    )}
                    {loan.disbursement_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disbursed:</span>
                        <span>{new Date(loan.disbursement_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {loan.repayment_start_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Repayment Start:</span>
                        <span>{new Date(loan.repayment_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {loan.repayment_end_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Repayment End:</span>
                        <span>{new Date(loan.repayment_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Information */}
                {(loan.username || loan.user_type) && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Applicant Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {loan.username && (
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-medium">{loan.username}</p>
                        </div>
                      )}
                      {loan.user_type && (
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <p className="font-medium">{loan.user_type}</p>
                        </div>
                      )}
                      {loan.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{loan.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SACCO Information */}
                {loan.sacco_name && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">SACCO Information</h4>
                    <p className="text-sm font-medium text-green-800">{loan.sacco_name}</p>
                    <p className="text-sm text-gray-600">Loan Product: {loan.loan_name || 'N/A'}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {loan.status === 'pending' && (
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => updateLoanApplicationStatus(loan.id, 'approved')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateLoanApplicationStatus(loan.id, 'rejected')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {loan.status === 'approved' && (
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => updateLoanApplicationStatus(loan.id, 'disbursed')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Mark as Disbursed
                    </button>
                    <button
                      onClick={() => updateLoanApplicationStatus(loan.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {loan.status === 'disbursed' && (
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      ✓ Loan has been disbursed successfully
                    </p>
                  </div>
                )}

                {loan.status === 'rejected' && (
                  <div className="bg-red-100 p-3 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ✗ Application was rejected
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSaccoModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{editingSacco ? 'Edit SACCO' : 'Create New SACCO'}</h3>
              <p className="text-gray-600 mt-1">{editingSacco ? 'Update SACCO details' : 'Set up a new Savings and Credit Cooperative for farmers'}</p>
            </div>
            <button
              onClick={() => {
                setShowCreateSaccoModal(false);
                setShowEditSaccoModal(false);
                setError(null);
                resetForm();
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
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleCreateOrUpdateSacco} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">SACCO Name</label>
                <input
                  type="text"
                  value={saccoForm.name}
                  onChange={(e) => setSaccoForm({ ...saccoForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  value={saccoForm.region}
                  onChange={(e) => setSaccoForm({ ...saccoForm, region: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={saccoForm.location}
                  onChange={(e) => setSaccoForm({ ...saccoForm, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                <input
                  type="text"
                  value={saccoForm.registration_number}
                  onChange={(e) => setSaccoForm({ ...saccoForm, registration_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Founded Date</label>
                <input
                  type="date"
                  value={saccoForm.founded_date}
                  onChange={(e) => setSaccoForm({ ...saccoForm, founded_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Members</label>
                <input
                  type="number"
                  value={saccoForm.total_members}
                  onChange={(e) => setSaccoForm({ ...saccoForm, total_members: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Assets (KSh)</label>
                <input
                  type="number"
                  value={saccoForm.total_assets}
                  onChange={(e) => setSaccoForm({ ...saccoForm, total_assets: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={saccoForm.contact_email}
                  onChange={(e) => setSaccoForm({ ...saccoForm, contact_email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={saccoForm.contact_phone}
                  onChange={(e) => setSaccoForm({ ...saccoForm, contact_phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={saccoForm.address}
                  onChange={(e) => setSaccoForm({ ...saccoForm, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  rows="4"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={saccoForm.description}
                  onChange={(e) => setSaccoForm({ ...saccoForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  rows="4"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {saccoForm.logo && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {saccoForm.logo.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Active Status</label>
                <input
                  type="checkbox"
                  checked={saccoForm.is_active}
                  onChange={(e) => setSaccoForm({ ...saccoForm, is_active: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Active</span>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateSaccoModal(false);
                  setShowEditSaccoModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingSacco}
                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center ${
                  isCreatingSacco ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isCreatingSacco ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  editingSacco ? 'Update SACCO' : 'Create SACCO'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading && !showLoanApplications && !showAllLoans) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading SACCO data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Manage SACCOs</h1>
        <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
          Create, manage, and monitor Savings and Credit Cooperatives for farmers across Kenya
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        </div>
      )}

      {error && (
        <div
          className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 ${
            error.includes('updated') ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {showAllLoans ? (
        renderAllLoans()
      ) : showLoanApplications ? (
        renderLoanApplications()
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">SACCO Management</h2>
                <p className="text-gray-600">Manage existing SACCOs and create new ones for farmers</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateSaccoModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New SACCO
                </button>

                <button
                  onClick={fetchAllLoans}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View All Loans
                </button>

                <button
                  onClick={fetchAllLoanApplications}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View All Applications
                </button>

                <div className="flex-1 max-w-xs">
                  <div className="flex">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Regions</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Active SACCOs</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {saccos.filter((s) => s.is_active).length} Active | {saccos.length} Total
              </span>
            </div>

            {saccos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SACCOs Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first SACCO</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateSaccoModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create First SACCO
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {saccos.map((sacco) => (
                  <div key={sacco.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start mb-4">
                          {sacco.logo ? (
                            <img src={sacco.logo} alt={sacco.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                              <span className="text-white font-bold text-xl">{sacco.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-1">{sacco.name}</h3>
                                <p className="text-gray-600 mb-2">{sacco.location}, {sacco.region}</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  sacco.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {sacco.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{sacco.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Members:</span>
                                <p className="text-gray-800">{sacco.total_members?.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Assets:</span>
                                <p className="text-gray-800">KSh {sacco.total_assets?.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Contact:</span>
                                <p className="text-gray-800">{sacco.contact_phone}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Email:</span>
                                <p className="text-gray-800 truncate">{sacco.contact_email}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">
                        Registration: {sacco.registration_number} | Founded:{' '}
                        {sacco.founded_date ? new Date(sacco.founded_date).getFullYear() : 'N/A'}
                        {sacco.is_active && (
                          <span className="ml-2 text-green-600 font-medium">Visible to {sacco.region} farmers</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fetchLoanApplications(sacco.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          View Applications ({sacco.pending_applications || 0})
                        </button>

                        <button
                          onClick={() => fetchSaccoMembers(sacco.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          View Members ({sacco.total_members || 0})
                        </button>

                        <button
                          onClick={() => deactivateSacco(sacco.id)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            sacco.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!sacco.is_active}
                        >
                          {sacco.is_active ? 'Deactivate' : 'Inactive'}
                        </button>

                        <button
                          onClick={() => handleEditSacco(sacco)}
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

      {(showCreateSaccoModal || showEditSaccoModal) && renderSaccoModal()}

      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">SACCO Members</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {saccoMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No members found for this SACCO.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {saccoMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.membership_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.join_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.shares || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSh {(member.savings || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSacco;