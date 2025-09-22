import React, { useState, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiSearch, 
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiX,
  FiUpload,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import agriConnectAPI from '../../services/api';

function ManageECommerce() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Predefined category types
  const categoryTypes = [
    { id: 'seeds', name: 'Seeds', icon: '🌱', color: 'bg-green-100 text-green-700' },
    { id: 'fertilizers', name: 'Fertilizers', icon: '🧪', color: 'bg-blue-100 text-blue-700' },
    { id: 'pesticides', name: 'Pesticides', icon: '🐜', color: 'bg-red-100 text-red-700' },
    { id: 'tools', name: 'Tools', icon: '🛠️', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'machinery', name: 'Machinery', icon: '🚜', color: 'bg-purple-100 text-purple-700' },
    { id: 'others', name: 'Others', icon: '📦', color: 'bg-gray-100 text-gray-700' }
  ];

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    image: null,
    imagePreview: '',
    brand: '',
    weight: '',
    dimensions: '',
    is_active: true
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: '',
    description: '',
    image: null,
    imagePreview: ''
  });

  // Edit states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    if (!agriConnectAPI.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!agriConnectAPI.isAdmin()) {
      setError('Access denied. Administrator privileges required.');
      return;
    }
    
    fetchCategories();
    if (selectedTab === 'products') {
      fetchProducts(currentPage);
    }
  }, [selectedTab, currentPage, searchTerm, filterStatus, navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.ecommerce.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { 
        page,
        per_page: 10,
        search: searchTerm
      };
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const data = await agriConnectAPI.ecommerce.adminGetProducts(params);
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      
      if (err.message.includes('Admin access required') || err.message.includes('authentication')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e, setState, isProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Please select an image file smaller than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isProduct) {
          setNewProduct(prev => ({
            ...prev,
            image: file,
            imagePreview: reader.result
          }));
        } else {
          setNewCategory(prev => ({
            ...prev,
            image: file,
            imagePreview: reader.result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = (e, isProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Please select an image file smaller than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isProduct) {
          setEditingProduct(prev => ({
            ...prev,
            image: file,
            imagePreview: reader.result
          }));
        } else {
          setEditingCategory(prev => ({
            ...prev,
            image: file,
            imagePreview: reader.result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(newProduct).forEach(key => {
        if (key === 'image' && newProduct.image) {
          formData.append('image', newProduct.image);
        } else if (newProduct[key] !== null && newProduct[key] !== undefined && newProduct[key] !== '') {
          formData.append(key, newProduct[key]);
        }
      });

      await agriConnectAPI.ecommerce.createProduct(formData);
      
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        stock_quantity: '',
        image: null,
        imagePreview: '',
        brand: '',
        weight: '',
        dimensions: '',
        is_active: true
      });
      
      setShowForm(false);
      setSuccess('Product created successfully!');
      fetchProducts(currentPage);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create product');
      console.error('Error creating product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(newCategory).forEach(key => {
        if (key === 'image' && newCategory.image) {
          formData.append('image', newCategory.image);
        } else if (newCategory[key] !== null && newCategory[key] !== undefined && newCategory[key] !== '') {
          formData.append(key, newCategory[key]);
        }
      });

      await agriConnectAPI.ecommerce.createCategory(formData);
      
      setNewCategory({
        name: '',
        type: '',
        description: '',
        image: null,
        imagePreview: ''
      });
      
      setShowForm(false);
      setSuccess('Category created successfully!');
      fetchCategories();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create category');
      console.error('Error creating category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      image: null,
      imagePreview: product.image ? `${API_BASE_URL}/static/uploads/${product.image}` : ''
    });
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory({
      ...category,
      image: null,
      imagePreview: category.image ? `${API_BASE_URL}/static/uploads/${category.image}` : ''
    });
    setShowForm(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(editingProduct).forEach(key => {
        if (key === 'image' && editingProduct.image) {
          formData.append('image', editingProduct.image);
        } else if (editingProduct[key] !== null && editingProduct[key] !== undefined && editingProduct[key] !== '') {
          formData.append(key, editingProduct[key]);
        }
      });

      await agriConnectAPI.ecommerce.updateProduct(editingProduct.id, formData);
      
      setEditingProduct(null);
      setShowForm(false);
      setSuccess('Product updated successfully!');
      fetchProducts(currentPage);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update product');
      console.error('Error updating product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(editingCategory).forEach(key => {
        if (key === 'image' && editingCategory.image) {
          formData.append('image', editingCategory.image);
        } else if (editingCategory[key] !== null && editingCategory[key] !== undefined && editingCategory[key] !== '') {
          formData.append(key, editingCategory[key]);
        }
      });

      await agriConnectAPI.ecommerce.updateCategory(editingCategory.id, formData);
      
      setEditingCategory(null);
      setShowForm(false);
      setSuccess('Category updated successfully!');
      fetchCategories();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update category');
      console.error('Error updating category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        setError(null);
        setLoading(true);
        
        await agriConnectAPI.ecommerce.deleteProduct(productId);
        setSuccess('Product deleted successfully!');
        fetchProducts(currentPage);
        
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err.message || 'Failed to delete product');
        console.error('Error deleting product:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category may be affected.')) {
      try {
        setError(null);
        setLoading(true);
        
        await agriConnectAPI.ecommerce.deleteCategory(categoryId);
        setSuccess('Category deleted successfully!');
        fetchCategories();
        
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err.message || 'Failed to delete category');
        console.error('Error deleting category:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductStatusChange = async (productId, isActive) => {
    try {
      setError(null);
      
      await agriConnectAPI.ecommerce.updateProductStatus(productId, isActive);
      setSuccess(`Product ${isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchProducts(currentPage);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update product status');
      console.error('Error updating product:', err);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditingCategory(null);
    setShowForm(false);
    setError(null);
  };

  // Format price in Kenyan Shillings
  const formatPrice = (price) => {
    return `KSh ${parseFloat(price).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.is_active === (filterStatus === 'active');
    return matchesSearch && matchesStatus;
  });

  // Show access denied if not admin
  if (!agriConnectAPI.isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have administrator privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="text-lg font-medium text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-Commerce Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your agricultural marketplace products and categories
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome back, Admin | 
                <button 
                  onClick={agriConnectAPI.auth.logout}
                  className="ml-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setSuccess(null)}
                  className="inline-flex text-green-800 rounded-md p-1 hover:bg-green-100"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiXCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setError(null)}
                  className="inline-flex text-red-800 rounded-md p-1 hover:bg-red-100"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="-mb-px flex space-x-8 border-b border-gray-200">
            {[
              { id: 'products', name: 'Products', icon: FiShoppingCart, count: products.length },
              { id: 'categories', name: 'Categories', icon: FiPackage, count: categories.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  cancelEdit();
                }}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`mr-2 h-5 w-5 ${selectedTab === tab.id ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedTab === tab.id 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Products Management */}
        {selectedTab === 'products' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <FiShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <FiEye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => p.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <FiEyeOff className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => !p.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    {showForm ? 'Cancel' : 'Add New Product'}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <FiSearch className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Section */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={editingProduct ? editingProduct.name : newProduct.name}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, name: e.target.value})
                            : setNewProduct({...newProduct, name: e.target.value})
                          }
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (KSh) *</label>
                        <input
                          type="number"
                          placeholder="Price"
                          value={editingProduct ? editingProduct.price : newProduct.price}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, price: e.target.value})
                            : setNewProduct({...newProduct, price: e.target.value})
                          }
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <select
                          value={editingProduct ? editingProduct.category_id : newProduct.category_id}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, category_id: e.target.value})
                            : setNewProduct({...newProduct, category_id: e.target.value})
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={editingProduct ? editingProduct.stock_quantity : newProduct.stock_quantity}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, stock_quantity: e.target.value})
                            : setNewProduct({...newProduct, stock_quantity: e.target.value})
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input
                          type="text"
                          placeholder="Product brand"
                          value={editingProduct ? (editingProduct.brand || '') : newProduct.brand}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, brand: e.target.value})
                            : setNewProduct({...newProduct, brand: e.target.value})
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          placeholder="Product Description"
                          rows={4}
                          value={editingProduct ? editingProduct.description : newProduct.description}
                          onChange={(e) => editingProduct 
                            ? setEditingProduct({...editingProduct, description: e.target.value})
                            : setNewProduct({...newProduct, description: e.target.value})
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                        <div className="flex items-center space-x-4">
                          {(editingProduct ? editingProduct.imagePreview : newProduct.imagePreview) && (
                            <div className="relative">
                              <img 
                                src={editingProduct ? editingProduct.imagePreview : newProduct.imagePreview} 
                                alt="Preview" 
                                className="h-40 w-40 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => editingProduct 
                                  ? setEditingProduct({...editingProduct, image: null, imagePreview: ''})
                                  : setNewProduct({...newProduct, image: null, imagePreview: ''})
                                }
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          )}
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                                  <span>Upload an image</span>
                                  <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    accept="image/*"
                                    onChange={(e) => editingProduct 
                                      ? handleEditImageUpload(e, true)
                                      : handleImageUpload(e, setNewProduct, true)
                                    }
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button 
                          type="button"
                          onClick={cancelEdit}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Add Product')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Products Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-6">
                Products
                <span className="text-green-600"> ({filteredProducts.length})</span>
              </h3>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-10">
                  <FiPackage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {products.length === 0 ? "No products found." : "No products match your search criteria."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.image && (
                                <img
                                  src={`${API_BASE_URL}/static/uploads/${product.image}`}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-full object-cover mr-3"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                                  }}
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {categories.find(c => c.id === product.category_id)?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEdit className="inline mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleProductStatusChange(product.id, !product.is_active)}
                              className={product.is_active ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                            >
                              {product.is_active ? <FiEyeOff className="inline mr-1" /> : <FiEye className="inline mr-1" />}
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="inline mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiChevronLeft className="h-5 w-5" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Management */}
        {selectedTab === 'categories' && (
          <div className="space-y-8">
            {/* Categories content would go here */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Categories</h3>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Add Category
                </button>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-10">
                  <FiPackage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">No categories found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold">{category.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${categoryTypes.find(ct => ct.id === category.type)?.color || 'bg-gray-100 text-gray-800'}`}>
                          {category.type}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FiEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <FiTrash2 className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageECommerce;