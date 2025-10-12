import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheckCircle, FiXCircle, FiPackage, FiSearch, FiFilter, FiStar } from "react-icons/fi";
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

  // Enhanced search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortOption, setSortOption] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

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
    image: null,
    imagePreview: '',
    brand: '',
    weight: '',
    dimensions: '',
    discount: 0,
    is_featured: false
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: '',
    description: '',
    image: null,
    imagePreview: ''
  });

  // Sort options
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'name_desc', label: 'Name: Z-A' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'bestselling', label: 'Best Selling' }
  ];

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

  // Enhanced filtering and sorting
  const filteredProducts = React.useMemo(() => {
    let result = products.filter(product => 
      activeCategory === "all" || product.category_id === parseInt(activeCategory)
    );

    // Apply search filter
    if (searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price range filter
    result = result.filter(product => 
      parseFloat(product.price) >= priceRange[0] && 
      parseFloat(product.price) <= priceRange[1]
    );

    // Apply sorting
    switch (sortOption) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price_low":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_high":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "bestselling":
        result.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
        break;
      default: // featured
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, activeCategory, searchQuery, priceRange, sortOption]);

  const handleImageUpload = (e, isProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Please select an image file smaller than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
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
      
      const productData = editingProduct || newProduct;
      
      // Frontend validation
      if (!productData.name || !productData.name.trim()) {
        setError('Product name is required');
        setLoading(false);
        return;
      }
      if (!productData.price || parseFloat(productData.price) <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }
      if (!productData.category_id) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      
      Object.keys(productData).forEach(key => {
        if (key === 'image' && productData.image) {
          formData.append('image', productData.image);
        } else if (key !== 'imagePreview' && key !== 'id' && productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      if (editingProduct) {
        // Update existing product
        await agriConnectAPI.ecommerce.updateProduct(editingProduct.id, formData);
        setSuccess('Product updated successfully!');
      } else {
        // Create new product
        await agriConnectAPI.ecommerce.createProduct(formData);
        setSuccess('Product created successfully!');
      }
      
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: activeCategory !== 'all' ? activeCategory : '',
        image: null,
        imagePreview: '',
        brand: '',
        weight: '',
        dimensions: '',
        discount: 0,
        is_featured: false
      });
      
      setEditingProduct(null);
      setShowProductForm(false);
      fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || (editingProduct ? 'Failed to update product' : 'Failed to create product'));
      setTimeout(() => setError(null), 5000);
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
      const categoryData = editingCategory || newCategory;
      
      // Validate required fields
      if (!categoryData.name || !categoryData.name.trim()) {
        setError('Category name is required');
        return;
      }
      
      Object.keys(categoryData).forEach(key => {
        if (key === 'image' && categoryData.image) {
          formData.append('image', categoryData.image);
        } else if (key !== 'imagePreview' && key !== 'id' && categoryData[key] !== null && categoryData[key] !== undefined) {
          formData.append(key, categoryData[key]);
        }
      });

      if (editingCategory) {
        // Update existing category
        await agriConnectAPI.ecommerce.updateCategory(editingCategory.id, formData);
        setSuccess('Category updated successfully!');
      } else {
        // Create new category
        await agriConnectAPI.ecommerce.createCategory(formData);
        setSuccess('Category created successfully!');
      }
      
      setNewCategory({
        name: '',
        type: '',
        description: '',
        image: null,
        imagePreview: ''
      });
      
      setEditingCategory(null);
      setShowCategoryForm(false);
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || (editingCategory ? 'Failed to update category' : 'Failed to create category'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      imagePreview: product.image || ''
    });
    setNewProduct({
      ...product,
      image: null,
      imagePreview: product.image || ''
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      await agriConnectAPI.ecommerce.deleteProduct(productId);
      setSuccess('Product deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete product';
      
      // Handle 404 case (product already deleted)
      if (err.response && err.response.status === 404) {
        setSuccess('Product was already deleted');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setLoading(false);
      // Always refresh the product list regardless of success or failure
      fetchProducts();
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({
      ...category,
      imagePreview: category.image || ''
    });
    setNewCategory({
      ...category,
      image: null,
      imagePreview: category.image || ''
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also affect all products in this category.')) {
      return;
    }

    try {
      setLoading(true);
      await agriConnectAPI.ecommerce.deleteCategory(categoryId);
      setSuccess('Category deleted successfully!');
      fetchCategories(); // Refresh the categories list
      fetchProducts(); // Refresh products as well
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the API functions remain the same)

  const formatPrice = (price, discount = 0) => {
    const finalPrice = parseFloat(price) * (1 - discount / 100);
    return `KSh ${finalPrice.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getDiscountedPrice = (price, discount = 0) => {
    return parseFloat(price) * (1 - discount / 100);
  };

  const resetForms = () => {
    setEditingProduct(null);
    setEditingCategory(null);
    setShowProductForm(false);
    setShowCategoryForm(false);
    setError(null);
  };

  // Skeleton loader component
  const ProductSkeleton = () => (
    <div className="bg-white border rounded-lg shadow p-4 animate-pulse">
      <div className="w-full h-48 bg-gray-300 rounded-md mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  );

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

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, description, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiFilter className="mr-2" />
              Filters
            </button>
            
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              setSearchQuery("");
              setPriceRange([0, 100000]);
              setSortOption("featured");
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear All
          </button>
        </div>

        {showFilters && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: KSh {priceRange[0].toLocaleString()} - KSh {priceRange[1].toLocaleString()}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100000"
                step="100"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="100000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

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
          <div key={cat.id} className="relative group">
            <button
              onClick={() => setActiveCategory(cat.id.toString())}
              className={`px-4 py-2 rounded-lg shadow transition-colors ${
                activeCategory === cat.id.toString()
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat.name} ({products.filter(p => p.category_id === cat.id).length})
            </button>
            
            {/* Edit/Delete buttons - only show on hover */}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(cat);
                }}
                className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="Edit Category"
              >
                <FiEdit size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.id);
                }}
                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete Category"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          </div>
        ))}

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

      {/* Enhanced Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg shadow p-4 flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Image with Badges */}
                <div className="relative mb-4">
                  <img
                    src={product.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23374151'%3ENo Image%3C/text%3E%3C/svg%3E"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23374151'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.discount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {product.discount}% OFF
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <FiStar className="mr-1 text-yellow-400" />
                      {product.rating || "4.5"}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                
                {/* Price Display */}
                <div className="mb-2">
                  {product.discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold text-lg">
                        {formatPrice(product.price, product.discount)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        KSh {parseFloat(product.price).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-green-600 font-bold text-lg">
                      KSh {parseFloat(product.price).toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                
                {/* Action Buttons */}
                <div className="flex justify-between gap-2 pt-4 border-t">
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 flex items-center justify-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <FiEdit className="mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 flex items-center justify-center text-red-600 hover:text-red-800 text-sm font-medium"
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
                  ? "No products found matching your criteria." 
                  : `No products found in ${categories.find(c => c.id.toString() === activeCategory)?.name} category.`}
              </p>
              {(searchQuery || priceRange[0] > 0 || priceRange[1] < 100000) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPriceRange([0, 100000]);
                  }}
                  className="mt-4 text-green-600 hover:text-green-700"
                >
                  Clear filters to see all products
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Product Form Modal */}
      {(showProductForm || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={resetForms} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.discount || 0 : newProduct.discount}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({...editingProduct, discount: parseInt(e.target.value)})
                        : setNewProduct({...newProduct, discount: parseInt(e.target.value)})
                      }
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Category and Stock */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Inventory</h4>
                  
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
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct ? editingProduct.is_featured : newProduct.is_featured}
                        onChange={(e) => editingProduct 
                          ? setEditingProduct({...editingProduct, is_featured: e.target.checked})
                          : setNewProduct({...newProduct, is_featured: e.target.checked})
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editingProduct ? editingProduct.description : newProduct.description}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, description: e.target.value})
                    : setNewProduct({...newProduct, description: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product description, features, and specifications..."
                />
              </div>
              
              {/* Image Upload */}
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
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 800x600px, max 5MB</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
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
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={resetForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
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
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                <select
                  value={editingCategory ? editingCategory.type : newCategory.type}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, type: e.target.value})
                    : setNewCategory({...newCategory, type: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Type</option>
                  <option value="seeds">Seeds</option>
                  <option value="fertilizers">Fertilizers</option>
                  <option value="tools">Tools</option>
                  <option value="equipment">Equipment</option>
                  <option value="pesticides">Pesticides</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="organic">Organic Products</option>
                  <option value="livestock">Livestock Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingCategory ? editingCategory.description : newCategory.description}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, description: e.target.value})
                    : setNewCategory({...newCategory, description: e.target.value})
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                <input
                  type="file"
                  onChange={(e) => handleImageChange(e, 'category')}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {((editingCategory && editingCategory.imagePreview) || newCategory.imagePreview) && (
                  <div className="mt-2">
                    <img
                      src={editingCategory ? editingCategory.imagePreview : newCategory.imagePreview}
                      alt="Category preview"
                      className="w-32 h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
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