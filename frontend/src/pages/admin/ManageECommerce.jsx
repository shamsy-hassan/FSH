import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiX, FiCheckCircle, FiXCircle, FiPackage } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import agriConnectAPI from "../../services/api";

const ManageECommerce = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

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
    fetchProducts();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.ecommerce.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await agriConnectAPI.ecommerce.adminGetProducts({ page: 1, per_page: 100 });
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Filtered products based on active category
  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((p) => p.category_id === parseInt(activeCategory));

  const handleImageUpload = (e, isProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Please select an image file smaller than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isProduct) {
          if (editingProduct) {
            setEditingProduct(prev => ({
              ...prev,
              image: file,
              imagePreview: reader.result
            }));
          } else {
            setNewProduct(prev => ({
              ...prev,
              image: file,
              imagePreview: reader.result
            }));
          }
        } else {
          if (editingCategory) {
            setEditingCategory(prev => ({
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
        } else if (newProduct[key] !== null && newProduct[key] !== undefined) {
          formData.append(key, newProduct[key]);
        }
      });

      await agriConnectAPI.ecommerce.createProduct(formData);
      
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: activeCategory !== 'all' ? activeCategory : '',
        stock_quantity: '',
        image: null,
        imagePreview: '',
        brand: '',
        weight: '',
        dimensions: '',
        is_active: true
      });
      
      setShowProductForm(false);
      setSuccess('Product created successfully!');
      fetchProducts();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create product');
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
        } else if (newCategory[key] !== null && newCategory[key] !== undefined) {
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
      
      setShowCategoryForm(false);
      setSuccess('Category created successfully!');
      fetchCategories();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      image: null,
      imagePreview: product.image ? `/static/uploads/${product.image}` : ''
    });
    setShowProductForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory({
      ...category,
      image: null,
      imagePreview: category.image ? `/static/uploads/${category.image}` : ''
    });
    setShowCategoryForm(true);
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
        } else if (editingProduct[key] !== null && editingProduct[key] !== undefined) {
          formData.append(key, editingProduct[key]);
        }
      });

      await agriConnectAPI.ecommerce.updateProduct(editingProduct.id, formData);
      
      setEditingProduct(null);
      setShowProductForm(false);
      setSuccess('Product updated successfully!');
      fetchProducts();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update product');
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
        } else if (editingCategory[key] !== null && editingCategory[key] !== undefined) {
          formData.append(key, editingCategory[key]);
        }
      });

      await agriConnectAPI.ecommerce.updateCategory(editingCategory.id, formData);
      
      setEditingCategory(null);
      setShowCategoryForm(false);
      setSuccess('Category updated successfully!');
      fetchCategories();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update category');
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
        fetchProducts();
        
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err.message || 'Failed to delete product');
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
      fetchProducts();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update product status');
    }
  };

  const formatPrice = (price) => {
    return `KSh ${parseFloat(price).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const resetForms = () => {
    setEditingProduct(null);
    setEditingCategory(null);
    setShowProductForm(false);
    setShowCategoryForm(false);
    setError(null);
  };

  if (!agriConnectAPI.isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-green-700">Manage E-Commerce</h1>
        <p className="text-gray-600">Manage your agricultural marketplace products and categories</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-800">{success}</p>
            <button 
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-800 hover:text-green-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiXCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-800 hover:text-red-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg shadow transition-colors ${
            activeCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          All Products ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id.toString())}
            className={`px-4 py-2 rounded-lg shadow transition-colors ${
              activeCategory === cat.id.toString()
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat.name} ({products.filter(p => p.category_id === cat.id).length})
          </button>
        ))}

        {/* Last button → Add Category */}
        <button
          onClick={() => setShowCategoryForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          <FiPlus className="inline mr-1" /> Add Category
        </button>
      </div>

      {/* Active Category Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {activeCategory === "all"
            ? "All Products"
            : `${categories.find(c => c.id.toString() === activeCategory)?.name} Products`}
          <span className="text-green-600 ml-2">({filteredProducts.length})</span>
        </h2>

        {/* Add Product button for each category (not All) */}
        {activeCategory !== "all" && (
          <button
            onClick={() => {
              setNewProduct(prev => ({ ...prev, category_id: activeCategory }));
              setShowProductForm(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            <FiPlus className="inline mr-1" /> Add Product to {categories.find(c => c.id.toString() === activeCategory)?.name}
          </button>
        )}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg shadow p-4 flex flex-col hover:shadow-md transition-shadow"
              >
                <img
                  src={product.image ? `/static/uploads/${product.image}` : "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                />
                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                <p className="text-green-600 font-bold">{formatPrice(product.price)}</p>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-500">Stock: {product.stock_quantity}</span>
                </div>

                <div className="flex justify-between mt-4 pt-4 border-t">
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit className="mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => handleProductStatusChange(product.id, !product.is_active)}
                    className={`flex items-center ${
                      product.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {product.is_active ? <FiEyeOff className="mr-1" /> : <FiEye className="mr-1" />}
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex items-center text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FiPackage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {activeCategory === 'all' 
                  ? "No products available." 
                  : `No products available in ${categories.find(c => c.id.toString() === activeCategory)?.name} category.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {(showProductForm || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={resetForms} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={editingProduct ? editingProduct.name : newProduct.name}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({...editingProduct, name: e.target.value})
                      : setNewProduct({...newProduct, name: e.target.value})
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh) *</label>
                  <input
                    type="number"
                    value={editingProduct ? editingProduct.price : newProduct.price}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({...editingProduct, price: e.target.value})
                      : setNewProduct({...newProduct, price: e.target.value})
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={editingProduct ? editingProduct.category_id : newProduct.category_id}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({...editingProduct, category_id: e.target.value})
                      : setNewProduct({...newProduct, category_id: e.target.value})
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct ? editingProduct.stock_quantity : newProduct.stock_quantity}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({...editingProduct, stock_quantity: e.target.value})
                      : setNewProduct({...newProduct, stock_quantity: e.target.value})
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct ? editingProduct.description : newProduct.description}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, description: e.target.value})
                    : setNewProduct({...newProduct, description: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center space-x-4">
                  {(editingProduct ? editingProduct.imagePreview : newProduct.imagePreview) && (
                    <img 
                      src={editingProduct ? editingProduct.imagePreview : newProduct.imagePreview} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded border"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {(showCategoryForm || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={resetForms} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, name: e.target.value})
                    : setNewCategory({...newCategory, name: e.target.value})
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Type *</label>
                <select
                  value={editingCategory ? editingCategory.type : newCategory.type}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, type: e.target.value})
                    : setNewCategory({...newCategory, type: e.target.value})
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Type</option>
                  <option value="seeds">Seeds</option>
                  <option value="fertilizers">Fertilizers</option>
                  <option value="pesticides">Pesticides</option>
                  <option value="tools">Tools</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="machinery">Machinery</option>
                  <option value="others">Others</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingCategory ? editingCategory.description : newCategory.description}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, description: e.target.value})
                    : setNewCategory({...newCategory, description: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingCategory ? 'Update Category' : 'Add Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageECommerce;