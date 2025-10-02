// Sacco.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';

function Sacco() {
  const [saccos, setSaccos] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [availableLoans, setAvailableLoans] = useState([]);
  const [myLoanApplications, setMyLoanApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [selectedSacco, setSelectedSacco] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState('');

  const [loanApplication, setLoanApplication] = useState({
    sacco_id: '',
    loan_id: '',
    amount: '',
    purpose: '',
    period: '',
    collateral: ''
  });

  const [joinForm, setJoinForm] = useState({
    name: '',
    phone: '',
    email: '',
    id_number: '',
    initial_deposit: ''
  });

  const [savingsForm, setSavingsForm] = useState({
    sacco_id: '',
    amount: '',
    transaction_type: 'deposit', // deposit or withdrawal
    description: ''
  });

  const regions = ['North', 'South', 'East', 'West', 'Central'];

  useEffect(() => {
    fetchSaccos();
    fetchMyData();
  }, [selectedRegion]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSaccos();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSaccos = async () => {
    try {
      const params = {
        region: selectedRegion || null,
        search: searchQuery || null
      };
      const data = await agriConnectAPI.sacco.getSaccos(params);
      setSaccos(data.saccos || []);
    } catch (err) {
      console.error('Error fetching SACCOs:', err);
      setError('Failed to load SACCOs');
    }
  };

  const fetchMyData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's memberships
      const membershipsData = await agriConnectAPI.sacco.getMemberships();
      setMyMemberships(membershipsData.memberships || []);
      
      // Fetch user's loan applications
      const applicationsData = await agriConnectAPI.sacco.getLoanApplications();
      setMyLoanApplications(applicationsData.applications || []);
      
    } catch (err) {
      setError('Failed to fetch your data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSacco = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.sacco.joinSacco(selectedSacco, joinForm);
      setSuccess('Welcome to the SACCO! Your membership is being processed.');
      setShowJoinForm(false);
      setJoinForm({
        name: '',
        phone: '',
        email: '',
        id_number: '',
        initial_deposit: ''
      });
      fetchMyData(); // Refresh memberships
      setActiveTab('dashboard');
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError('Failed to join SACCO. Please try again.');
      console.error('Error joining SACCO:', err);
    }
  };

  // NEW: Handle savings transactions
  const handleSavingsTransaction = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.sacco.processSavingsTransaction(savingsForm);
      setSuccess(`Savings ${savingsForm.transaction_type} processed successfully!`);
      setShowSavingsForm(false);
      setSavingsForm({
        sacco_id: '',
        amount: '',
        transaction_type: 'deposit',
        description: ''
      });
      fetchMyData(); // Refresh memberships to update savings balance
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(`Failed to process ${savingsForm.transaction_type}. Please try again.`);
      console.error('Error processing savings transaction:', err);
    }
  };

  const applyForLoan = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.sacco.applyForLoan({
        ...loanApplication,
        sacco_id: selectedSacco
      });
      setSuccess('Loan application submitted successfully! You will be notified of the decision soon.');
      setShowLoanForm(false);
      setLoanApplication({
        sacco_id: '',
        loan_id: '',
        amount: '',
        purpose: '',
        period: '',
        collateral: ''
      });
      fetchMyData(); // Refresh applications
      setActiveTab('my-loans');
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError('Failed to apply for loan');
      console.error('Error applying for loan:', err);
    }
  };

  const fetchLoansForSacco = async (saccoId) => {
    try {
      const data = await agriConnectAPI.sacco.getLoans(saccoId);
      setAvailableLoans(data.loans || []);
      setSelectedSacco(saccoId);
      setShowLoanForm(true);
    } catch (err) {
      setError('Failed to fetch loans');
      console.error('Error fetching loans:', err);
    }
  };

  // NEW: Open savings form for a specific SACCO
  const openSavingsForm = (saccoId, transactionType = 'deposit') => {
    setSavingsForm({
      sacco_id: saccoId,
      amount: '',
      transaction_type: transactionType,
      description: ''
    });
    setShowSavingsForm(true);
  };

  const calculateLoan = () => {
    const amount = parseFloat(loanApplication.amount);
    const period = parseInt(loanApplication.period);
    if (!amount || !period) return null;
    
    const interest = amount * 0.12 * (period / 12);
    const total = amount + interest;
    const monthly = total / period;
    
    return {
      principal: amount,
      interest: interest.toFixed(2),
      total: total.toFixed(2),
      monthly: monthly.toFixed(2)
    };
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

  // Filter saccos based on search and membership status
  const filteredSaccos = React.useMemo(() => {
    return saccos.filter(sacco => {
      const matchesSearch = !searchQuery || 
        sacco.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sacco.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sacco.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isNotMember = !myMemberships.some(m => m.sacco_id === sacco.id);
      
      return matchesSearch && isNotMember;
    });
  }, [saccos, searchQuery, myMemberships]);

  // NEW: Calculate total savings across all memberships
  const calculateTotalSavings = () => {
    return myMemberships.reduce((total, membership) => {
      return total + (parseFloat(membership.savings) || 0);
    }, 0);
  };

  // NEW: Calculate total shares across all memberships
  const calculateTotalShares = () => {
    return myMemberships.reduce((total, membership) => {
      return total + (parseFloat(membership.shares) || 0);
    }, 0);
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading your dashboard...</span>
        </div>
      );
    }

    const totalSavings = calculateTotalSavings();
    const totalShares = calculateTotalShares();
    const activeLoans = myLoanApplications.filter(app => app.status === 'approved' || app.status === 'disbursed').length;
    const pendingApplications = myLoanApplications.filter(app => app.status === 'pending').length;

    return (
      <div className="space-y-8">
        {/* Welcome Message */}
        {myMemberships.length > 0 ? (
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-6 text-center border border-green-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back to your SACCO Dashboard!</h2>
            <p className="text-gray-600 mb-4">
              Manage your memberships, contributions, and loan applications across {myMemberships.length} SACCO{myMemberships.length !== 1 ? 's' : ''}
            </p>
            {pendingApplications > 0 && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {pendingApplications} loan application{pendingApplications !== 1 ? 's' : ''} pending review
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 text-center border border-orange-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Started with SACCO Services</h2>
            <p className="text-gray-600 mb-6">Join a farming cooperative to access affordable loans and grow your savings</p>
            <button
              onClick={() => setActiveTab('available')}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Browse SACCOs
            </button>
          </div>
        )}

        {/* Enhanced Stats Grid with Savings Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Total Savings</h3>
                <p className="text-3xl font-bold text-green-600">KSh {totalSavings.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Across all your SACCO memberships</p>
            <button 
              onClick={() => setActiveTab('memberships')}
              className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Manage Savings →
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Total Shares</h3>
                <p className="text-3xl font-bold text-blue-600">KSh {totalShares.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Your ownership in SACCOs</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Active Memberships</h3>
                <p className="text-3xl font-bold text-purple-600">{myMemberships.filter(m => m.is_active).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Active SACCO memberships</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Loan Applications</h3>
                <p className="text-3xl font-bold text-orange-600">{myLoanApplications.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">{activeLoans} active, {pendingApplications} pending</p>
          </div>
        </div>

        {/* Enhanced Quick Actions with Savings */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group cursor-pointer" onClick={() => setActiveTab('memberships')}>
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group-hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Add Savings</h4>
                    <p className="text-sm text-green-700">Deposit to your account</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Grow your savings across all SACCOs</p>
              </div>
            </div>

            <div className="group cursor-pointer" onClick={() => setActiveTab('memberships')}>
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group-hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">My Memberships</h4>
                    <p className="text-sm text-blue-700">{myMemberships.filter(m => m.is_active).length} Active</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">View your SACCO accounts and balances</p>
              </div>
            </div>

            <div className="group cursor-pointer" onClick={() => setActiveTab('my-loans')}>
              <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors group-hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-purple-100 rounded-full mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">My Loans</h4>
                    <p className="text-sm text-purple-700">{myLoanApplications.length} Applications</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Track your loan applications and repayments</p>
              </div>
            </div>

            <div className="group cursor-pointer" onClick={() => setActiveTab('available')}>
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors group-hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-yellow-100 rounded-full mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Available SACCOs</h4>
                    <p className="text-sm text-yellow-700">{filteredSaccos.length} to Join</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Discover new farming cooperatives near you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity with Savings Transactions */}
        {(myLoanApplications.length > 0 || myMemberships.length > 0) && (
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {myLoanApplications.slice(0, 2).map(application => (
                <div key={application.id} className="flex items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {application.loan_name || 'Loan Application'} - KSh {application.amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{application.sacco_name}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-sm text-gray-500">{new Date(application.application_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              
              {myMemberships.slice(0, 2).map(membership => (
                <div key={membership.id} className="flex items-center p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Savings account - {membership.sacco_name}
                    </p>
                    <p className="text-sm text-gray-500">KSh {parseFloat(membership.savings).toLocaleString()} total savings</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button 
                      onClick={() => openSavingsForm(membership.sacco_id, 'deposit')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Add Savings
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(myLoanApplications.length > 2 || myMemberships.length > 2) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setActiveTab(myLoanApplications.length > myMemberships.length ? 'my-loans' : 'memberships')}
                  className="text-blue-600 hover:underline text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  View all activity
                </button>
              </div>
            )}
          </div>
        )}

        {/* Available SACCOs Preview */}
        {myMemberships.length === 0 && filteredSaccos.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Featured SACCOs Near You</h3>
              <button 
                onClick={() => setActiveTab('available')}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                See all ({filteredSaccos.length})
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSaccos.slice(0, 3).map(sacco => (
                <div key={sacco.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {sacco.logo ? (
                    <img 
                      src={sacco.logo} 
                      alt={sacco.name} 
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded mb-3 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{sacco.name.charAt(0)}</span>
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1 truncate">{sacco.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 truncate">{sacco.location}, {sacco.region}</p>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{sacco.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>{sacco.total_members} members</span>
                    <span>KSh {sacco.total_assets?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSacco(sacco.id);
                      setShowJoinForm(true);
                    }}
                    className="w-full py-2 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Join SACCO
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMyMemberships = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">My SACCO Memberships</h2>
          <p className="text-gray-600">Manage your active SACCO accounts and contributions</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Savings: KSh {calculateTotalSavings().toLocaleString()}
        </div>
      </div>

      {myMemberships.length === 0 ? (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Memberships</h3>
          <p className="text-gray-600 mb-6">Join a SACCO to start accessing financial services and growing with fellow farmers</p>
          <div className="space-x-3">
            <button
              onClick={() => setActiveTab('available')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Browse SACCOs
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myMemberships.map(membership => (
            <div key={membership.id} className="bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              {/* SACCO Header */}
              <div className="flex items-start mb-6">
                {membership.sacco_logo ? (
                  <img 
                    src={membership.sacco_logo} 
                    alt={membership.sacco_name} 
                    className="w-16 h-16 object-cover rounded-lg mr-4 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-xl">{membership.sacco_name.charAt(0)}</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 truncate">{membership.sacco_name}</h3>
                      <p className="text-sm text-gray-500 truncate">{membership.sacco_location}, {membership.sacco_region}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ml-3 ${
                      membership.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {membership.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{membership.sacco_description}</p>
                </div>
              </div>

              {/* Enhanced Financial Summary with Savings Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    KSh {parseFloat(membership.savings || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-700 font-medium">Savings Balance</div>
                  <button 
                    onClick={() => openSavingsForm(membership.sacco_id, 'deposit')}
                    className="mt-2 text-green-600 hover:text-green-700 text-xs font-medium"
                  >
                    Add Savings
                  </button>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    KSh {parseFloat(membership.shares || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 font-medium">Shares Value</div>
                </div>
              </div>

              {/* Membership Details */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-medium text-gray-900">{new Date(membership.join_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membership ID:</span>
                  <span className="font-medium text-gray-900">{membership.membership_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Members:</span>
                  <span className="font-medium text-gray-900">{membership.sacco_total_members?.toLocaleString()}</span>
                </div>
                {membership.last_contribution_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Contribution:</span>
                    <span className="font-medium text-gray-900">{new Date(membership.last_contribution_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons with Savings Options */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => fetchLoansForSacco(membership.sacco_id)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center"
                  disabled={!membership.is_active}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Apply for Loan
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => openSavingsForm(membership.sacco_id, 'deposit')}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Savings
                  </button>
                  
                  <button
                    onClick={() => window.open(`mailto:${membership.sacco_contact_email}?subject=SACCO Inquiry&body=Hello ${membership.sacco_name} team,`, '_blank')}
                    className="py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    title={`Contact ${membership.sacco_name}`}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact
                  </button>
                </div>
              </div>

              {!membership.is_active && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    This membership is currently inactive. Contact the SACCO administrator for assistance.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMyLoans = () => {
    const filteredLoans = statusFilter === 'all' 
      ? myLoanApplications 
      : myLoanApplications.filter(app => app.status === statusFilter);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">My Loan Applications</h2>
            <p className="text-gray-600">Track the status of your loan requests across all SACCOs</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total: {myLoanApplications.length} | {statusFilter}: {filteredLoans.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status ({myLoanApplications.length})</option>
              <option value="pending">Pending ({myLoanApplications.filter(l => l.status === 'pending').length})</option>
              <option value="approved">Approved ({myLoanApplications.filter(l => l.status === 'approved').length})</option>
              <option value="rejected">Rejected ({myLoanApplications.filter(l => l.status === 'rejected').length})</option>
              <option value="disbursed">Disbursed ({myLoanApplications.filter(l => l.status === 'disbursed').length})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading your applications...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No loan applications yet' : `No ${statusFilter} applications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? 'Apply for a loan through one of your SACCO memberships to get started'
                : `Your ${statusFilter} applications will appear here once processed`
              }
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => setActiveTab('memberships')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply for a Loan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* Loan Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {loan.loan_name || `Loan Application #${loan.id}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {loan.sacco_name} • {new Date(loan.application_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ml-3 whitespace-nowrap ${
                      getStatusBadgeClass(loan.status)
                    }`}
                  >
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </span>
                </div>

                {/* Loan Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Amount</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        KSh {loan.amount?.toLocaleString() || "0"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {loan.repayment_period_months || 'N/A'} months
                        {loan.interest_rate && ` • ${loan.interest_rate}% APR`}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Applied</span>
                      <span className="font-medium">
                        {new Date(loan.application_date).toLocaleDateString()}
                        {loan.days_since_application !== null && (
                          <span className="text-gray-500 ml-1">({loan.days_since_application} days ago)</span>
                        )}
                      </span>
                    </div>
                    
                    {loan.approval_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {loan.status === 'approved' ? 'Approved' : 'Processed'}
                        </span>
                        <span className="font-medium">
                          {new Date(loan.approval_date).toLocaleDateString()}
                          {loan.processing_days !== null && (
                            <span className="text-gray-500 ml-1">({loan.processing_days} days processing)</span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {loan.disbursement_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Disbursed</span>
                        <span className="font-medium">{new Date(loan.disbursement_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {loan.repayment_start_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Repayment Starts</span>
                        <span className="font-medium">{new Date(loan.repayment_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {loan.repayment_end_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Repayment Ends</span>
                        <span className="font-medium">{new Date(loan.repayment_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-2 border-t border-gray-100">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Purpose</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{loan.purpose || "N/A"}</p>
                  </div>

                  {loan.loan_type && (
                    <div className="py-2">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Loan Type</span>
                      </div>
                      <p className="text-sm text-gray-600">{loan.loan_type}</p>
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                {loan.status === 'approved' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-semibold text-green-800">Loan Approved!</p>
                    </div>
                    <p className="text-sm text-green-800">
                      Your loan of KSh {loan.amount?.toLocaleString()} has been approved. 
                      {loan.approval_date && ` Approved on ${new Date(loan.approval_date).toLocaleDateString()}.`}
                      {!loan.disbursement_date && ' Funds will be disbursed within 3 business days.'}
                    </p>
                  </div>
                )}

                {loan.status === 'rejected' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-sm font-semibold text-red-800">Application Not Approved</p>
                    </div>
                    <p className="text-sm text-red-800">
                      Your application for KSh {loan.amount?.toLocaleString()} was not approved.
                      {loan.approval_date && ` Decision made on ${new Date(loan.approval_date).toLocaleDateString()}.`}
                      Contact {loan.sacco_name} for more details or consider reapplying with adjusted terms.
                    </p>
                  </div>
                )}

                {loan.status === 'pending' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-yellow-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-yellow-800">Under Review</p>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Your application for KSh {loan.amount?.toLocaleString()} is being reviewed by {loan.sacco_name}.
                      {loan.days_since_application !== null && ` Submitted ${loan.days_since_application} days ago.`}
                      You will be notified within 3 business days.
                    </p>
                  </div>
                )}

                {loan.status === 'disbursed' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-blue-800">Loan Disbursed</p>
                    </div>
                    <p className="text-sm text-blue-800">
                      Your loan of KSh {loan.amount?.toLocaleString()} has been disbursed.
                      {loan.disbursement_date && ` Disbursed on ${new Date(loan.disbursement_date).toLocaleDateString()}.`}
                      {loan.repayment_start_date && ` Repayment starts on ${new Date(loan.repayment_start_date).toLocaleDateString()}.`}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  {loan.status === 'disbursed' ? (
                    <button
                      onClick={() => {
                        // Navigate to repayment schedule or loan details
                        console.log('View loan details:', loan.id);
                      }}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      View Repayment Schedule
                    </button>
                  ) : loan.status === 'approved' ? (
                    <button
                      onClick={() => {
                        // Contact SACCO for disbursement details
                        window.open(`mailto:${loan.sacco_contact_email}?subject=Loan Disbursement Inquiry&body=Regarding loan application #${loan.id}:`, '_blank');
                      }}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Contact for Disbursement
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedSacco(loan.sacco_id);
                        fetchLoansForSacco(loan.sacco_id);
                      }}
                      className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      disabled={loan.status === 'rejected'}
                    >
                      {loan.status === 'rejected' ? 'Contact SACCO' : 'Apply Again'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAvailableSaccos = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Available SACCOs</h2>
          <p className="text-gray-600">Discover farming cooperatives in your area</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search SACCOs by name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <button 
            onClick={fetchSaccos}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {filteredSaccos.length === 0 ? (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchQuery ? 'No SACCOs match your search' : selectedRegion ? `No SACCOs in ${selectedRegion}` : 'No SACCOs available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search terms' : selectedRegion ? 'Try selecting a different region' : 'Check back soon for new SACCOs'}
          </p>
          <div className="space-x-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={fetchSaccos}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh List
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSaccos.map(sacco => (
            <div key={sacco.id} className="bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
              {/* SACCO Visual */}
              <div className="mb-4">
                {sacco.logo ? (
                  <img 
                    src={sacco.logo} 
                    alt={sacco.name} 
                    className="w-full h-40 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:opacity-90 transition-opacity duration-300">
                    <span className="text-white font-bold text-4xl">{sacco.name.charAt(0)}</span>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">{sacco.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {sacco.location}, {sacco.region}
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      sacco.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sacco.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">{sacco.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{sacco.total_members?.toLocaleString()} members</span>
                </div>
                <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>KSh {sacco.total_assets?.toLocaleString()}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {sacco.contact_email}
                </div>
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {sacco.contact_phone}
                </div>
                {sacco.founded_date && (
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Founded {new Date(sacco.founded_date).getFullYear()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!sacco.is_active ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">This SACCO is currently inactive</p>
                  <p className="text-xs text-gray-400">Check back later or contact the administrator</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedSacco(sacco.id);
                      setShowJoinForm(true);
                    }}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center group-hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Join SACCO
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSacco(sacco.id);
                        fetchLoansForSacco(sacco.id);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                      disabled={!sacco.is_active}
                    >
                      View Loans
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${sacco.contact_email}?subject=SACCO Inquiry&body=Hello ${sacco.name} team,`, '_blank')}
                      className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredSaccos.length > 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            Showing {filteredSaccos.length} of {saccos.length} available SACCOs
            {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
            {selectedRegion && <span className="ml-1">in {selectedRegion}</span>}
          </p>
        </div>
      )}
    </div>
  );

  const renderJoinFormModal = () => {
    const selectedSaccoData = saccos.find(s => s.id === selectedSacco);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Join {selectedSaccoData?.name}</h3>
                <p className="text-sm text-gray-600">Complete your membership application</p>
              </div>
              <button 
                onClick={() => setShowJoinForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedSaccoData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  {selectedSaccoData.logo ? (
                    <img src={selectedSaccoData.logo} alt={selectedSaccoData.name} className="w-10 h-10 object-cover rounded mr-3" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">{selectedSaccoData.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedSaccoData.name}</h4>
                    <p className="text-sm text-blue-700">{selectedSaccoData.location}</p>
                  </div>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>📍 {selectedSaccoData.region}</p>
                  <p>👥 {selectedSaccoData.total_members?.toLocaleString()} members</p>
                  <p>💰 Assets: KSh {selectedSaccoData.total_assets?.toLocaleString()}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinSacco} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={joinForm.name}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+254 700 123 456"
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={joinForm.email}
                    onChange={(e) => setJoinForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number *</label>
                  <input
                    type="text"
                    placeholder="12345678"
                    value={joinForm.id_number}
                    onChange={(e) => setJoinForm(prev => ({ ...prev, id_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Deposit (Minimum KSh 1,000) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">KSh</span>
                  </div>
                  <input
                    type="number"
                    placeholder="1000"
                    value={joinForm.initial_deposit}
                    onChange={(e) => setJoinForm(prev => ({ ...prev, initial_deposit: e.target.value }))}
                    min="1000"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Your membership shares will be calculated as 50% of this amount</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the SACCO's{' '}
                    <button
                      type="button"
                      onClick={() => window.open(selectedSaccoData?.terms_url || '#', '_blank')}
                      className="text-blue-600 hover:underline"
                    >
                      terms and conditions
                    </button>{' '}
                    and confirm the information provided is accurate
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowJoinForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 sm:flex-none flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderLoanFormModal = () => {
    const calculatorResult = calculateLoan();
    const saccoMembership = myMemberships.find(m => m.sacco_id === selectedSacco);
    const selectedSaccoData = saccos.find(s => s.id === selectedSacco);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Apply for Loan</h3>
                <p className="text-sm text-gray-600">
                  {selectedSaccoData?.name} • {saccoMembership ? 'Existing Member' : 'New Application'}
                </p>
              </div>
              <button 
                onClick={() => setShowLoanForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {saccoMembership && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Your Membership Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Savings: KSh {parseFloat(saccoMembership.savings).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Shares: KSh {parseFloat(saccoMembership.shares).toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  💡 Maximum loan available: KSh {(parseFloat(saccoMembership.savings || 0) * 3).toLocaleString()}
                </p>
              </div>
            )}

            <form onSubmit={applyForLoan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (KSh) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">KSh</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Enter loan amount"
                      value={loanApplication.amount}
                      onChange={(e) => setLoanApplication({
                        ...loanApplication,
                        amount: e.target.value
                      })}
                      min="1000"
                      max={saccoMembership ? parseFloat(saccoMembership.savings || 0) * 3 : 50000}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  {saccoMembership && (
                    <p className="text-xs text-gray-500 mt-1">
                      Based on your savings of KSh {parseFloat(saccoMembership.savings).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Period *</label>
                  <select
                    value={loanApplication.period}
                    onChange={(e) => setLoanApplication({
                      ...loanApplication,
                      period: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Period</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Loan *</label>
                <textarea
                  placeholder="Describe what you need the loan for (e.g., farm equipment, seeds, livestock, irrigation system, etc.)"
                  value={loanApplication.purpose}
                  onChange={(e) => setLoanApplication({
                    ...loanApplication,
                    purpose: e.target.value
                  })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collateral/Security (Optional)</label>
                <textarea
                  placeholder="Describe any collateral you can provide (land title, livestock, farm equipment, guarantor, etc.)"
                  value={loanApplication.collateral}
                  onChange={(e) => setLoanApplication({
                    ...loanApplication,
                    collateral: e.target.value
                  })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Loan Calculator */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Loan Calculator (12% annual interest)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Amount (KSh)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-blue-500">KSh</span>
                      </div>
                      <input
                        type="number"
                        value={loanApplication.amount}
                        onChange={(e) => setLoanApplication({
                          ...loanApplication,
                          amount: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Period (Months)</label>
                    <select
                      value={loanApplication.period}
                      onChange={(e) => setLoanApplication({
                        ...loanApplication,
                        period: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>
                </div>

                {calculatorResult && (
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Principal Amount:</p>
                        <p className="font-bold text-gray-900">KSh {calculatorResult.principal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Interest (12% p.a.):</p>
                        <p className="font-bold text-orange-600">KSh {calculatorResult.interest}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Total Repayable:</p>
                        <p className="font-bold text-blue-600">KSh {calculatorResult.total}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Monthly Payment:</p>
                        <p className="font-bold text-green-600">KSh {calculatorResult.monthly}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="loan_terms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="loan_terms" className="text-sm text-gray-700">
                  I confirm that the information provided is accurate and agree to the loan{' '}
                  <a href="#" className="text-blue-600 hover:underline">terms and conditions</a>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowLoanForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                >
                  Cancel Application
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex-1 sm:flex-none flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Savings Form Modal
  const renderSavingsFormModal = () => {
    const selectedSaccoData = saccos.find(s => s.id === savingsForm.sacco_id);
    const membership = myMemberships.find(m => m.sacco_id === savingsForm.sacco_id);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {savingsForm.transaction_type === 'deposit' ? 'Add Savings' : 'Withdraw Savings'}
                </h3>
                <p className="text-sm text-gray-600">{selectedSaccoData?.name}</p>
              </div>
              <button 
                onClick={() => setShowSavingsForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedSaccoData && membership && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  {selectedSaccoData.logo ? (
                    <img src={selectedSaccoData.logo} alt={selectedSaccoData.name} className="w-10 h-10 object-cover rounded mr-3" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">{selectedSaccoData.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedSaccoData.name}</h4>
                    <p className="text-sm text-blue-700">Current Balance: KSh {parseFloat(membership.savings).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSavingsTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KSh) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">KSh</span>
                  </div>
                  <input
                    type="number"
                    placeholder={savingsForm.transaction_type === 'deposit' ? "Enter amount to deposit" : "Enter amount to withdraw"}
                    value={savingsForm.amount}
                    onChange={(e) => setSavingsForm(prev => ({ ...prev, amount: e.target.value }))}
                    min="100"
                    max={savingsForm.transaction_type === 'withdrawal' ? (membership?.savings || 0) : undefined}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {savingsForm.transaction_type === 'withdrawal' && membership && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum withdrawal: KSh {parseFloat(membership.savings).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly savings, Emergency withdrawal, etc."
                  value={savingsForm.description}
                  onChange={(e) => setSavingsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I confirm this {savingsForm.transaction_type} transaction
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowSavingsForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 sm:flex-none flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm {savingsForm.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderNavigationTabs = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden sticky top-0 z-10">
      <div className="flex overflow-x-auto border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-4 font-medium whitespace-nowrap flex items-center ${
            activeTab === 'dashboard' 
              ? 'bg-green-600 text-white border-b-2 border-green-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'
          } transition-colors`}
        >
          <svg className={`w-5 h-5 mr-2 ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </button>
        
        <button
          onClick={() => setActiveTab('memberships')}
          className={`px-6 py-4 font-medium whitespace-nowrap flex items-center ${
            activeTab === 'memberships' 
              ? 'bg-green-600 text-white border-b-2 border-green-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'
          } transition-colors`}
        >
          <svg className={`w-5 h-5 mr-2 ${activeTab === 'memberships' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          My Memberships
        </button>
        
        <button
          onClick={() => setActiveTab('my-loans')}
          className={`px-6 py-4 font-medium whitespace-nowrap flex items-center ${
            activeTab === 'my-loans' 
              ? 'bg-green-600 text-white border-b-2 border-green-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'
          } transition-colors`}
        >
          <svg className={`w-5 h-5 mr-2 ${activeTab === 'my-loans' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          My Loans
        </button>
        
        <button
          onClick={() => setActiveTab('available')}
          className={`px-6 py-4 font-medium whitespace-nowrap flex items-center ${
            activeTab === 'available' 
              ? 'bg-green-600 text-white border-b-2 border-green-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'
          } transition-colors`}
        >
          <svg className={`w-5 h-5 mr-2 ${activeTab === 'available' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-12h2m-2 8h2M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 21H7m2 0h2m-2-8h.01M15 13h2m-2 4h.01" />
          </svg>
          Available SACCOs
        </button>
      </div>
    </div>
  );

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your SACCO dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AgriConnect SACCO Platform - Serving Farmers Across Kenya
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Gateway to Agricultural Finance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Join farming cooperatives to access affordable loans, grow your savings, and connect with fellow farmers in your community
          </p>
          {!myMemberships.length && (
            <button
              onClick={() => setActiveTab('available')}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Discover SACCOs Near You
            </button>
          )}
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
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {renderNavigationTabs()}

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'memberships' && renderMyMemberships()}
          {activeTab === 'my-loans' && renderMyLoans()}
          {activeTab === 'available' && renderAvailableSaccos()}
        </div>

        {/* Modals */}
        {showJoinForm && renderJoinFormModal()}
        {showLoanForm && renderLoanFormModal()}
        {showSavingsForm && renderSavingsFormModal()}
      </div>
    </div>
  );
}

export default Sacco;