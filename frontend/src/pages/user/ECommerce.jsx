import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiUser,
  FiArrowRight,
  FiHome
} from 'react-icons/fi';
import agriConnectAPI from '../../services/api';

function ECommerce() {
  const navigate = useNavigate();
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
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [orderMessage, setOrderMessage] = useState(null);
  const [quantitySelectors, setQuantitySelectors] = useState({});

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
      setCart(data.cart?.items || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    try {
      if (!agriConnectAPI.isAuthenticated()) {
        setError('Please login to add items to cart');
        setTimeout(() => setError(null), 3000);
        return;
      }
      await agriConnectAPI.ecommerce.addToCart(product.id, quantity);
      await fetchCart();
      setCartVisible(true);
      setOrderMessage({
        type: 'success',
        title: 'Added to Cart!',
        message: `${quantity} x ${product.name} added to cart successfully!`
      });
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
      setOrderMessage({
        type: 'info',
        title: 'Cart Cleared',
        message: 'All items have been removed from your cart'
      });
      setTimeout(() => setOrderMessage(null), 3000);
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
      
      // Place the order
      await agriConnectAPI.ecommerce.placeOrder(order);
      
      // Clear the cart after successful order
      await agriConnectAPI.ecommerce.clearCart();
      setCart([]);
      setCartVisible(false);
      
      // Show success message
      setOrderMessage({
        type: 'success',
        title: "Order Placed Successfully!",
        message: `Your order will be delivered to ${orderData.deliveryLocation} by ${deliveryDateString}.`,
        order: order
      });

      // Navigate to orders page after a short delay
      setTimeout(() => {
        navigate('/user/my-orders');
      }, 2000);
      
    } catch (err) {
      console.error("Failed to place order:", err);
      setOrderMessage({
        type: 'error',
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

  // Enhanced quick order function
  const placeDirectOrder = async (product, quantity = 1) => {
    if (!agriConnectAPI.isAuthenticated()) {
      setError('Please login to place orders');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Enhanced shipping address prompt with validation
    const shippingAddress = prompt(
      '🚚 Quick Order - Shipping Information\n\nPlease provide your shipping address for delivery:',
      'Enter your full address including city and postal code'
    );

    if (!shippingAddress || shippingAddress.trim() === '' || shippingAddress === 'Enter your full address including city and postal code') {
      setError('Shipping address is required for placing orders');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setLoading(true);
      
      // Add product to cart with specified quantity
      await agriConnectAPI.ecommerce.addToCart(product.id, quantity);
      
      // Create order with proper shipping address
      const orderData = {
        shipping_address: shippingAddress.trim(),
        billing_address: shippingAddress.trim(),
        payment_method: 'cash_on_delivery',
      };

      await agriConnectAPI.ecommerce.placeOrder(orderData);
      
      // Refresh cart
      await fetchCart();
      
      setOrderMessage({
        type: 'success',
        title: "Order Placed Successfully!",
        message: `Your order for ${quantity} x ${product.name} will be delivered to your address within 2-3 business days.`,
        order: { product_name: product.name, total: parseFloat(product.price) * quantity }
      });

      // Navigate to orders page
      setTimeout(() => {
        navigate('/user/my-orders');
      }, 2000);
      
    } catch (err) {
      console.error("Failed to place quick order:", err);
      setError(`Failed to place order: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getPopularProducts = () => {
    return [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4);
  };

  // Handle quantity selection for products
  const handleQuantityChange = (productId, quantity) => {
    setQuantitySelectors(prev => ({
      ...prev,
      [productId]: quantity
    }));
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
    <div className={`min-h-screen pb-20 ${cartVisible ? 'mr-80' : ''} transition-all duration-300`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">🌾 Farmers Market Hub</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Your one-stop shop for quality agricultural inputs and farm supplies
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => categories.length > 0 && setSelectedCategory(categories[0].id)}
              className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center"
            >
              <FiHome className="mr-2" />
              Shop Now
            </button>
            <button 
              onClick={() => navigate('/user/my-orders')}
              className="bg-yellow-400 text-green-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition flex items-center"
            >
              <FiPackage className="mr-2" />
              My Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto pl-3"
              >
                <FiX className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {orderMessage && (
          <div className={`mb-4 p-4 rounded-lg border ${
            orderMessage.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : orderMessage.type === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className={`text-lg ${
                  orderMessage.type === 'success' ? 'text-green-400' : 
                  orderMessage.type === 'error' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {orderMessage.type === 'success' ? '✅' : 
                   orderMessage.type === 'error' ? '❌' : 'ℹ️'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <h4 className={`font-medium ${
                  orderMessage.type === 'success' ? 'text-green-800' : 
                  orderMessage.type === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {orderMessage.title}
                </h4>
                <p className={`text-sm ${
                  orderMessage.type === 'success' ? 'text-green-700' : 
                  orderMessage.type === 'error' ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {orderMessage.message}
                </p>
              </div>
              <button 
                onClick={() => setOrderMessage(null)}
                className="ml-auto pl-3"
              >
                <FiX className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-500" />
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <label className="block mb-2 font-medium text-gray-700">
              💰 Price Range: KSh {priceRange[0].toLocaleString()} - KSh {priceRange[1].toLocaleString()}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center ${
              !selectedCategory 
                ? "bg-green-600 text-white shadow-lg" 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            📦 All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center ${
                selectedCategory === category.id
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {categoryTypes[category.name?.toLowerCase()]?.icon || '📦'} {category.name}
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedCategory 
                  ? `${categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'} Products`
                  : 'All Products'
                }
                <span className="text-green-600 ml-2">({filteredProducts.length})</span>
              </h3>
              
              {/* Cart Summary Button */}
              <button 
                onClick={() => setCartVisible(!cartVisible)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FiShoppingCart />
                Cart ({cart.length})
                <span className="bg-yellow-400 text-green-900 px-2 py-1 rounded text-sm font-bold">
                  KSh {calculateCartTotal().toLocaleString()}
                </span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {filteredProducts.map((product) => (
                <EnhancedProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart}
                  placeDirectOrder={placeDirectOrder}
                  quantitySelectors={quantitySelectors}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setPriceRange([0, 10000]);
                  }}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* Enhanced Cart Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          cartVisible ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <CartSidebar 
            cart={cart}
            cartVisible={cartVisible}
            setCartVisible={setCartVisible}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            calculateCartTotal={calculateCartTotal}
            handleCheckout={handleCheckout}
            navigate={navigate}
          />
        </div>

        {/* Mobile Cart Overlay */}
        {cartVisible && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
            onClick={() => setCartVisible(false)}
          ></div>
        )}
      </main>
    </div>
  );
}

// Enhanced Product Card Component
function EnhancedProductCard({ product, addToCart, placeDirectOrder, quantitySelectors, onQuantityChange }) {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const handleQuickOrder = () => {
    placeDirectOrder(product, quantity);
    setQuantity(1); // Reset quantity after ordering
  };

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          className="w-full h-48 object-cover transition-transform duration-300"
          src={product.image || product.img || "/placeholder-product.jpg"}
          alt={product.name}
          onError={(e) => {
            e.target.src = "/placeholder-product.jpg";
          }}
        />
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between">
          {product.isOrganic && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              🌱 Organic
            </span>
          )}
          {product.discount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {product.discount}% OFF
            </span>
          )}
        </div>
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={handleQuickOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                ⚡ Order Now
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm">{product.name}</h3>
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
            <FiStar className="text-yellow-400 text-xs" />
            <span className="ml-1 text-xs font-medium">{product.rating || "4.5"}</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex justify-between items-center mb-3">
          <div>
            {product.discount > 0 ? (
              <>
                <span className="text-red-500 font-bold text-lg">
                  KSh {Math.round(parseFloat(product.price) * (1 - product.discount/100)).toLocaleString()}
                </span>
                <span className="ml-2 text-sm text-gray-400 line-through">
                  KSh {parseFloat(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-green-600 font-bold text-lg">
                KSh {parseFloat(product.price).toLocaleString()}
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            product.stock_quantity > 10 ? 'bg-green-100 text-green-800' : 
            product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }`}>
            {product.stock_quantity > 10 ? 'In Stock' : 
             product.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Quantity Selector and Action Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                disabled={quantity <= 1}
              >
                <FiMinus className="h-3 w-3" />
              </button>
              <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                disabled={product.stock_quantity > 0 && quantity >= product.stock_quantity}
              >
                <FiPlus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={product.stock_quantity <= 0}
            >
              <FiShoppingCart className="mr-1" />
              Add to Cart
            </button>
            
            {product.stock_quantity > 0 && (
              <button
                onClick={handleQuickOrder}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                title="Quick Order - Order this product directly"
              >
                <FiPackage className="mr-1" />
                Order Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Cart Sidebar Component
function CartSidebar({ cart, cartVisible, setCartVisible, updateQuantity, removeFromCart, clearCart, calculateCartTotal, handleCheckout, navigate }) {
  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="p-6 border-b border-gray-200 bg-green-600 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <FiShoppingCart className="h-5 w-5 mr-2" />
            Shopping Cart ({cart.length})
          </h2>
          <button
            onClick={() => setCartVisible(false)}
            className="p-2 text-white hover:text-green-100 rounded-lg hover:bg-green-700"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <p className="text-green-100 text-sm mt-1">
          Total: KSh {calculateCartTotal().toLocaleString()}
        </p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FiShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started.</p>
            <button
              onClick={() => setCartVisible(false)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={item.product?.image || item.image || 'https://via.placeholder.com/60x60/f8f9fa/6c757d?text=Product'}
                  alt={item.product?.name || item.name}
                  className="w-12 h-12 object-cover rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name || item.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    KSh {parseFloat(item.product?.price || item.price).toLocaleString()} × {item.quantity}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                  >
                    <FiMinus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                  >
                    <FiPlus className="h-3 w-3" />
                  </button>
                </div>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-red-500 hover:text-red-700 rounded"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">KSh {calculateCartTotal().toLocaleString()}</span>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={async () => {
                  const shippingAddress = prompt(
                    '🚚 Please provide your shipping address:',
                    'Enter your full address including city and postal code'
                  );

                  if (!shippingAddress || shippingAddress.trim() === '') {
                    alert('Shipping address is required for placing orders');
                    return;
                  }

                  const orderData = {
                    shipping_address: shippingAddress.trim(),
                    billing_address: shippingAddress.trim(),
                    payment_method: 'cash_on_delivery',
                  };

                  await handleCheckout(orderData);
                }}
                className="w-full py-3 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center"
              >
                <FiCreditCard className="mr-2" />
                Proceed to Checkout
              </button>
              
              <button
                onClick={() => navigate('/user/my-orders')}
                className="w-full py-2 px-4 border border-green-600 text-green-600 text-sm font-medium rounded-lg hover:bg-green-50 transition flex items-center justify-center"
              >
                <FiArrowRight className="mr-2" />
                View My Orders
              </button>
              
              <button
                onClick={clearCart}
                className="w-full py-2 px-4 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ECommerce;