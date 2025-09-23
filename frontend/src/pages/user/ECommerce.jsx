import React, { useState, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiClock, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiStar, 
  FiFilter, 
  FiSearch, 
  FiX, 
  FiMinus, 
  FiPlus, 
  FiTrash2, 
  FiCreditCard,
  FiPackage,
  FiUser 
} from 'react-icons/fi';
import agriConnectAPI from '../../services/api';

function ECommerce() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]); // Added missing priceRange state
  const [orderMessage, setOrderMessage] = useState(null); // Added missing orderMessage state

  // Predefined category types with icons
  const categoryTypes = {
    seeds: { icon: '🌱', color: 'from-green-500 to-green-600', badge: 'bg-green-100 text-green-800' },
    fertilizers: { icon: '🧪', color: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-800' },
    pesticides: { icon: '🐜', color: 'from-red-500 to-red-600', badge: 'bg-red-100 text-red-800' },
    tools: { icon: '🛠️', color: 'from-yellow-500 to-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
    irrigation: { icon: '💧', color: 'from-indigo-500 to-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
    machinery: { icon: '🚜', color: 'from-purple-500 to-purple-600', badge: 'bg-purple-100 text-purple-800' },
    others: { icon: '📦', color: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-800' }
  };

  // Sort options
  const sortOptions = [
    { value: 'featured', label: 'Featured', icon: '⭐' },
    { value: 'price_low', label: 'Price: Low to High', icon: '💰' },
    { value: 'price_high', label: 'Price: High to Low', icon: '💎' },
    { value: 'newest', label: 'Newest First', icon: '🆕' },
    { value: 'bestselling', label: 'Best Selling', icon: '🔥' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (agriConnectAPI.isAuthenticated()) {
      fetchCart();
    }
  }, []);

  useEffect(() => {
    let delayDebounceFn;

    if (searchQuery) {
      delayDebounceFn = setTimeout(() => {
        fetchProducts(selectedCategory, searchQuery);
      }, 500);
    } else {
      fetchProducts(selectedCategory);
    }

    return () => {
      if (delayDebounceFn) clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, selectedCategory]);

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory);
    }

    // Filter by search term
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    result = result.filter(p => 
      parseFloat(p.price) >= priceRange[0] && parseFloat(p.price) <= priceRange[1]
    );

    // Sort products
    switch (sortOption) {
      case "price_low":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_high":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
        break;
      default:
        // Featured (default sorting)
        break;
    }

    setFilteredProducts(result);
  }, [selectedCategory, products, searchQuery, priceRange, sortOption]);

  const fetchCategories = async () => {
    try {
      const data = await agriConnectAPI.ecommerce.getCategories();
      setCategories(data.categories || []);
      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async (categoryId = null, search = searchQuery) => {
    try {
      setLoading(true);
      const params = { 
        category_id: categoryId, 
        search: search,
        page: 1,
        per_page: 20,
        sort: sortOption
      };
      const data = await agriConnectAPI.ecommerce.getProducts(params);
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!agriConnectAPI.isAuthenticated()) return;
    try {
      const data = await agriConnectAPI.ecommerce.getCart();
      setCart(data.items || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    try {
      if (!agriConnectAPI.isAuthenticated()) {
        setError('Please login to add items to cart');
        return;
      }
      await agriConnectAPI.ecommerce.addToCart(product.id, quantity);
      await fetchCart();
      setCartVisible(true);
      setOrderMessage(`${product.name} added to cart!`);
      setTimeout(() => setOrderMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add item to cart');
      console.error('Error adding to cart:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await agriConnectAPI.ecommerce.removeFromCart(itemId);
      await fetchCart();
    } catch (err) {
      setError(err.message || 'Failed to remove item from cart');
      console.error('Error removing from cart:', err);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
      return;
    }
    
    try {
      await agriConnectAPI.ecommerce.updateCartItem(itemId, newQuantity);
      await fetchCart();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      console.error('Error updating cart:', err);
    }
  };

  const clearCart = async () => {
    try {
      await agriConnectAPI.ecommerce.clearCart();
      await fetchCart();
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
      console.error('Error clearing cart:', err);
    }
  };

  const handleSortChange = (value) => {
    setSortOption(value);
    fetchProducts(selectedCategory, searchQuery);
  };

  const handleCheckout = async (orderData) => {
    try {
      setLoading(true);
      const deliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const deliveryDateString = deliveryDate.toLocaleString();

      const order = {
        ...orderData,
        customer: agriConnectAPI.getUserId() || "Guest",
        products: cart,
        total: calculateCartTotal(),
        status: "pending",
        deliveryDate: deliveryDateString,
        createdAt: new Date().toISOString()
      };

      console.log("Order submitted:", order);
      
      await agriConnectAPI.ecommerce.placeOrder(order);
      setCart([]);
      setCartVisible(false);
      setOrderMessage({
        title: "Order Placed Successfully!",
        message: `Your order will be delivered to ${orderData.deliveryLocation} by ${deliveryDateString}.`,
        order: order
      });
    } catch (err) {
      console.error("Failed to place order:", err);
      setOrderMessage({
        title: "Order Failed",
        message: "There was an error processing your order. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.product?.price || item.price) * item.quantity), 0);
  };

  const getPopularProducts = () => {
    return [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-green-100 text-green-700 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Farmers Market Hub</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Your one-stop shop for quality agricultural inputs and farm supplies
          </p>
          <button 
            onClick={() => categories.length > 0 && setSelectedCategory(categories[0].id)}
            className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Shop Now
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Order Message */}
        {orderMessage && (
          <div className={`mb-4 p-4 rounded-lg ${
            orderMessage.title === "Order Placed Successfully!" 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  orderMessage.title === "Order Placed Successfully!" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {orderMessage.title}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-700">{orderMessage.message}</p>
                {orderMessage.order && (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <p>Order ID: {orderMessage.order.id}</p>
                    <p>Total: KSh {orderMessage.order.total.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setOrderMessage(null)}
                className="ml-auto pl-3 text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-500" />
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Price Range: KSh {priceRange[0].toLocaleString()} - KSh {priceRange[1].toLocaleString()}</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !selectedCategory 
                ? "bg-green-600 text-white shadow-md" 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-6">
              {selectedCategory 
                ? `${categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'} Products`
                : 'All Products'
              }
              <span className="text-green-600"> ({filteredProducts.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart} 
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {/* Popular Products Section */}
        {!loading && products.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Popular Farm Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {getPopularProducts().map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Farmer Services Section */}
        <section className="bg-green-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-700">Our Services</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-green-600">Quality Seeds</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Certified high-yield varieties
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Disease-resistant strains
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Climate-adapted options
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-green-600">Fertilizers</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Organic and synthetic options
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Soil-specific formulations
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Bulk purchase discounts
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-green-600">Pesticides</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  EPA-approved chemicals
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Targeted pest solutions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Safety training available
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-green-600">Farm Tools</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Durable equipment
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Maintenance services
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Equipment financing
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setCartVisible(true)}
          className="flex items-center justify-center p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition"
          disabled={cart.length === 0}
        >
          <FiShoppingCart className="text-xl" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Cart Sidebar */}
      {cartVisible && (
        <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out ${
          cartVisible ? 'translate-x-0' : 'translate-x-full'
        } w-full max-w-md bg-white shadow-xl`}>
          <div className="h-full flex flex-col">
            {/* Cart Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                Shopping Cart ({cart.length} items)
              </h2>
              <button
                onClick={() => setCartVisible(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <FiShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some products to get started.</p>
                  <button
                    onClick={() => setCartVisible(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product?.image || item.image || 'https://via.placeholder.com/80x80/f8f9fa/6c757d?text=Product'}
                          alt={item.product?.name || item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80/f8f9fa/6c757d?text=Product';
                          }}
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.product?.name || item.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{item.product?.brand || item.brand}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          KSh {parseFloat(item.product?.price || item.price).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          KSh {(parseFloat(item.product?.price || item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    KSh {calculateCartTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Includes taxes & delivery</span>
                  <span className="font-medium">Free shipping</span>
                </div>
                
                {agriConnectAPI.isAuthenticated() ? (
                  <>
                    <button 
                      onClick={() => setCartVisible(false)}
                      className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <FiCreditCard className="inline h-4 w-4 mr-2" />
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full py-2 px-4 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      Clear Cart
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-4">Please sign in to continue</p>
                    <button className="w-full py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500">
                      <FiUser className="inline h-4 w-4 mr-2" />
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Overlay */}
      {cartVisible && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50" onClick={() => setCartVisible(false)}></div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, addToCart }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          className="w-full h-48 object-cover"
          src={product.image || product.img || "/placeholder-product.jpg"}
          alt={product.name}
          onError={(e) => {
            e.target.src = "/placeholder-product.jpg";
          }}
        />
        {product.isOrganic && (
          <span className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            Organic
          </span>
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {product.discount}% OFF
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-green-700 line-clamp-1">{product.name}</h3>
          <div className="flex items-center">
            <FiStar className="text-yellow-400" />
            <span className="ml-1 text-sm">{product.rating || "4.5"}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex justify-between items-center">
          <div>
            {product.discount > 0 ? (
              <>
                <span className="text-red-500 font-bold">KSh {Math.round(parseFloat(product.price) * (1 - product.discount/100))}</span>
                <span className="ml-2 text-sm text-gray-400 line-through">KSh {parseFloat(product.price).toLocaleString()}</span>
              </>
            ) : (
              <span className="text-green-600 font-bold">KSh {parseFloat(product.price).toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center"
            disabled={product.stock_quantity <= 0}
          >
            {product.stock_quantity > 0 ? 'Add' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ECommerce;