// api.js - AgriConnect Platform API Integration

const API_BASE_URL = 'http://localhost:5000/api'; // Change this to your actual API URL

class AgriConnectAPI {
    constructor() {
        this.token = localStorage.getItem('agriConnectToken');
        this.userType = localStorage.getItem('agriConnectUserType');
        this.userId = localStorage.getItem('agriConnectUserId');
    }

    // Set authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Handle API responses
    async handleResponse(response) {
        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
    }

    // Authentication API calls
    auth = {
        // User registration
        register: async (userData) => {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            return await this.handleResponse(response);
        },

        // User login
        login: async (username, password, userType = 'user') => {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, user_type: userType }),
            });

            const data = await this.handleResponse(response);
            
            if (data.access_token) {
                localStorage.setItem('agriConnectToken', data.access_token);
                localStorage.setItem('agriConnectUserType', data.user_type);
                localStorage.setItem('agriConnectUserId', data.user.id);
                
                // Update class instance
                this.token = data.access_token;
                this.userType = data.user_type;
                this.userId = data.user.id;
            }

            return data;
        },

        // Admin login
        adminLogin: async (username, password) => {
            return await this.auth.login(username, password, 'admin');
        },

        // Get user profile
        getProfile: async () => {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Logout
        logout: () => {
            localStorage.removeItem('agriConnectToken');
            localStorage.removeItem('agriConnectUserType');
            localStorage.removeItem('agriConnectUserId');
            
            // Update class instance
            this.token = null;
            this.userType = null;
            this.userId = null;
        },
    };

    // User API calls
    user = {
        // Get user dashboard
        getDashboard: async () => {
            const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get user profile
        getProfile: async () => {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Update user profile
        updateProfile: async (profileData) => {
            const formData = new FormData();
            
            // Append all profile data to formData
            Object.keys(profileData).forEach(key => {
                if (key === 'profile_picture' && profileData[key] instanceof File) {
                    formData.append(key, profileData[key]);
                } else {
                    formData.append(key, profileData[key]);
                }
            });

            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });

            return await this.handleResponse(response);
        },

        // Change password
        changePassword: async (currentPassword, newPassword) => {
            const response = await fetch(`${API_BASE_URL}/user/change-password`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            return await this.handleResponse(response);
        },
    };

    // Admin API calls
    admin = {
        // Get admin dashboard
        getDashboard: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get all users
        getUsers: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Update user status
        updateUserStatus: async (userId, isActive) => {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ is_active: isActive }),
            });

            return await this.handleResponse(response);
        },
    };

    // E-commerce API calls
    ecommerce = {
        // Public endpoints
        getCategories: async () => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/categories`, {
                method: 'GET',
            });
            return await this.handleResponse(response);
        },

        getCategory: async (categoryId) => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/categories/${categoryId}`, {
                method: 'GET',
            });
            return await this.handleResponse(response);
        },

        getProducts: async (params = {}) => {
            const queryParams = new URLSearchParams();
            if (params.category_id) queryParams.append('category_id', params.category_id);
            if (params.search) queryParams.append('search', params.search);
            if (params.sort) queryParams.append('sort', params.sort);
            if (params.page) queryParams.append('page', params.page);
            if (params.per_page) queryParams.append('per_page', params.per_page);

            const url = `${API_BASE_URL}/ecommerce/products?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
            });
            return await this.handleResponse(response);
        },

        getProduct: async (productId) => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/products/${productId}`, {
                method: 'GET',
            });
            return await this.handleResponse(response);
        },

        // User cart operations
        getCart: async () => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/cart`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        addToCart: async (productId, quantity = 1) => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ 
                    product_id: productId, 
                    quantity: quantity 
                }),
            });
            return await this.handleResponse(response);
        },

        updateCartItem: async (itemId, quantity) => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items/${itemId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ quantity }),
            });
            return await this.handleResponse(response);
        },

        removeFromCart: async (itemId) => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        clearCart: async () => {
            const response = await fetch(`${API_BASE_URL}/ecommerce/cart/clear`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        // Admin operations
        adminGetProducts: async (params = {}) => {
            // Removed frontend isAdmin() check to let backend handle admin validation
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.per_page) queryParams.append('per_page', params.per_page);
            if (params.status) queryParams.append('status', params.status);
            if (params.search) queryParams.append('search', params.search);

            const url = `${API_BASE_URL}/ecommerce/admin/products?${queryParams.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        createProduct: async (formData) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        },

        updateProduct: async (productId, formData) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        },

        deleteProduct: async (productId) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/products/${productId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        updateProductStatus: async (productId, isActive) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/products/${productId}/status`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ is_active: isActive }),
            });
            return await this.handleResponse(response);
        },

        createCategory: async (formData) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        },

        updateCategory: async (categoryId, formData) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        },

        deleteCategory: async (categoryId) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/ecommerce/categories/${categoryId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },
    };

    // Order API calls
    order = {
        getOrders: async (status = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/order/orders?page=${page}&per_page=${perPage}`;
            if (status && status !== 'all') {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        getOrder: async (orderId) => {
            const response = await fetch(`${API_BASE_URL}/order/orders/${orderId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        createOrder: async (orderData) => {
            const response = await fetch(`${API_BASE_URL}/order/orders`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(orderData),
            });
            return await this.handleResponse(response);
        },

        updateOrderStatus: async (orderId, status) => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/order/orders/${orderId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status }),
            });
            return await this.handleResponse(response);
        },

        updateOrder: async (orderId, orderData) => {
            const response = await fetch(`${API_BASE_URL}/order/orders/${orderId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(orderData),
            });
            return await this.handleResponse(response);
        },

        cancelOrder: async (orderId) => {
            const response = await fetch(`${API_BASE_URL}/order/orders/${orderId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },
    };

    // Market API calls
    market = {
        // Get market posts with optional filtering
        getPosts: async (category = null, region = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/market/posts?page=${page}&per_page=${perPage}`;
            if (category) {
                url += `&category=${category}`;
            }
            if (region) {
                url += `&region=${region}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific market post
        getPost: async (postId) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Create market post
        createPost: async (postData, images = []) => {
            const formData = new FormData();
            
            // Append post data
            Object.keys(postData).forEach(key => {
                formData.append(key, postData[key]);
            });
            
            // Append images
            images.forEach((image, index) => {
                formData.append('images', image);
            });

            const response = await fetch(`${API_BASE_URL}/market/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });

            return await this.handleResponse(response);
        },

        // Update market post
        updatePost: async (postId, postData) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(postData),
            });

            return await this.handleResponse(response);
        },

        // Delete market post
        deletePost: async (postId) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },
    };

    // SACCO API calls
    sacco = {
        // Get all SACCOS with optional region filtering
        getSaccos: async (region = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/sacco/saccos?page=${page}&per_page=${perPage}`;
            if (region) {
                url += `&region=${region}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific SACCO
        getSacco: async (saccoId) => {
            const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Join a SACCO
        joinSacco: async (saccoId) => {
            const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}/join`, {
                method: 'POST',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get user's SACCO memberships
        getMemberships: async () => {
            const response = await fetch(`${API_BASE_URL}/sacco/membership`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get loans with optional SACCO filtering
        getLoans: async (saccoId = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/sacco/loans?page=${page}&per_page=${perPage}`;
            if (saccoId) {
                url += `&sacco_id=${saccoId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Apply for a loan
        applyForLoan: async (loanData) => {
            const response = await fetch(`${API_BASE_URL}/sacco/loan-applications`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(loanData),
            });

            return await this.handleResponse(response);
        },

        // Get loan applications
        getLoanApplications: async (saccoId = null) => {
            let url = `${API_BASE_URL}/sacco/loan-applications`;
            if (saccoId) {
                url += `?sacco_id=${saccoId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },
    };

    // Agroclimate API calls
    agroclimate = {
        // Get all regions
        getRegions: async () => {
            const response = await fetch(`${API_BASE_URL}/agroclimate/regions`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific region
        getRegion: async (regionId) => {
            const response = await fetch(`${API_BASE_URL}/agroclimate/regions/${regionId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get weather data for a region
        getWeather: async (regionId) => {
            const response = await fetch(`${API_BASE_URL}/agroclimate/weather/${regionId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get crop recommendations for a region
        getCropRecommendations: async (regionId, season = null) => {
            let url = `${API_BASE_URL}/agroclimate/crop-recommendations/${regionId}`;
            if (season) {
                url += `?season=${season}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Create crop recommendation (admin only)
        createCropRecommendation: async (recommendationData) => {
            const response = await fetch(`${API_BASE_URL}/agroclimate/crop-recommendations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(recommendationData),
            });

            return await this.handleResponse(response);
        },
    };

    // Skill API calls
    skill = {
        // Get all skill categories
        getCategories: async () => {
            const response = await fetch(`${API_BASE_URL}/skill/categories`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific skill category
        getCategory: async (categoryId) => {
            const response = await fetch(`${API_BASE_URL}/skill/categories/${categoryId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get skills with optional filtering
        getSkills: async (categoryId = null, difficulty = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/skill/skills?page=${page}&per_page=${perPage}`;
            if (categoryId) {
                url += `&category_id=${categoryId}`;
            }
            if (difficulty) {
                url += `&difficulty=${difficulty}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific skill
        getSkill: async (skillId) => {
            const response = await fetch(`${API_BASE_URL}/skill/skills/${skillId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Create skill (admin only)
        createSkill: async (skillData) => {
            const response = await fetch(`${API_BASE_URL}/skill/skills`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(skillData),
            });

            return await this.handleResponse(response);
        },

        // Add skill video (admin only)
        addSkillVideo: async (videoData) => {
            const response = await fetch(`${API_BASE_URL}/skill/videos`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(videoData),
            });

            return await this.handleResponse(response);
        },
    };

    // Storage API calls
    storage = {
        // Get warehouses with optional region filtering
        getWarehouses: async (region = null, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/storage/warehouses?page=${page}&per_page=${perPage}`;
            if (region) {
                url += `&region=${region}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get specific warehouse
        getWarehouse: async (warehouseId) => {
            const response = await fetch(`${API_BASE_URL}/storage/warehouses/${warehouseId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Create storage request
        createStorageRequest: async (requestData) => {
            const response = await fetch(`${API_BASE_URL}/storage/storage-requests`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestData),
            });

            return await this.handleResponse(response);
        },

        // Get storage requests
        getStorageRequests: async (warehouseId = null) => {
            let url = `${API_BASE_URL}/storage/storage-requests`;
            if (warehouseId) {
                url += `?warehouse_id=${warehouseId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Update storage request status (admin only)
        updateStorageRequestStatus: async (requestId, status) => {
            const response = await fetch(`${API_BASE_URL}/storage/storage-requests/${requestId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status: status }),
            });

            return await this.handleResponse(response);
        },
    };

    // Message API calls
    message = {
        // Get conversations
        getConversations: async () => {
            const response = await fetch(`${API_BASE_URL}/message/conversations`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Create conversation
        createConversation: async (receiverId) => {
            const response = await fetch(`${API_BASE_URL}/message/conversations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ receiver_id: receiverId }),
            });

            return await this.handleResponse(response);
        },

        // Get messages in a conversation
        getMessages: async (conversationId) => {
            const response = await fetch(`${API_BASE_URL}/message/conversations/${conversationId}/messages`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Send message
        sendMessage: async (conversationId, content) => {
            const response = await fetch(`${API_BASE_URL}/message/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ content: content }),
            });

            return await this.handleResponse(response);
        },

        // Mark message as read
        markAsRead: async (messageId) => {
            const response = await fetch(`${API_BASE_URL}/message/messages/${messageId}/read`, {
                method: 'PUT',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },
    };

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    isAdmin() {
        return this.userType === 'admin';
    }

    getUserId() {
        return this.userId;
    }

    getUserType() {
        return this.userType;
    }

    // Token refresh method
    async refreshToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: this.getHeaders(),
            });

            const data = await this.handleResponse(response);

            if (data.access_token) {
                localStorage.setItem('agriConnectToken', data.access_token);
                this.token = data.access_token;
                return true;
            }
            return false;
        } catch (error) {
            this.auth.logout();
            return false;
        }
    }
}

// Create a singleton instance
const agriConnectAPI = new AgriConnectAPI();

// Export both default and named export
export default agriConnectAPI;
export { agriConnectAPI };