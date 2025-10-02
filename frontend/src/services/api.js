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
    const contentType = response.headers.get('content-type');
    
    if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } else {
        let error;
        if (contentType && contentType.includes('application/json')) {
            error = await response.json();
        } else {
            error = { message: await response.text() };
        }
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

                // Get user profile\n        getProfile: async () => {\n            const response = await fetch(`${API_BASE_URL}/auth/profile`, {\n                method: 'GET',\n                headers: this.getHeaders(),\n            });\n\n            return await this.handleResponse(response);\n        },\n\n        // Logout user\n        logout: async () => {\n            const response = await fetch(`${API_BASE_URL}/auth/logout`, {\n                method: 'POST',\n                headers: this.getHeaders(),\n            });\n\n            // Clear local storage\n            localStorage.removeItem('agriConnectToken');\n            localStorage.removeItem('agriConnectUserType');\n            localStorage.removeItem('agriConnectUserId');\n            \n            // Reset instance variables\n            this.token = null;\n            this.userType = null;\n            this.userId = null;\n\n            return await this.handleResponse(response);\n        },

        // Logout user
        logout: async () => {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: this.getHeaders(),
            });

            // Clear local storage
            localStorage.removeItem('agriConnectToken');
            localStorage.removeItem('agriConnectUserType');
            localStorage.removeItem('agriConnectUserId');
            
            // Reset instance variables
            this.token = null;
            this.userType = null;
            this.userId = null;

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
            // FIX: Use the correct backend endpoint
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Update user profile
        updateProfile: async (profileData) => {
            // Convert to FormData if file uploads are involved
            let body, headers;
            if (profileData instanceof FormData) {
                body = profileData;
                headers = {
                    'Authorization': `Bearer ${this.token}`,
                };
            } else {
                body = JSON.stringify(profileData);
                headers = this.getHeaders();
            }

            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: headers,
                body: body,
            });
            return await this.handleResponse(response);
        },

        // Upload profile picture
        uploadProfilePicture: async (file) => {
            const formData = new FormData();
            formData.append('picture', file);

            const response = await fetch(`${API_BASE_URL}/profile/picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        },

        // Delete profile picture
        deleteProfilePicture: async () => {
            const response = await fetch(`${API_BASE_URL}/profile/picture`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        // Create user profile
        createProfile: async (profileData) => {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData),
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

        // Search users
        searchUsers: async (query = '', limit = 20, showAll = false) => {
            let url = `${API_BASE_URL}/user/search?limit=${limit}`;
            if (showAll) {
                url += '&all=true';
            } else if (query) {
                url += `&q=${encodeURIComponent(query)}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },
    };

    // User API calls
    user = {
        // Search users
        searchUsers: async (query = '', limit = 20, showAll = false) => {
            let url = `${API_BASE_URL}/user/search?limit=${limit}`;
            if (showAll) {
                url += '&all=true';
            } else if (query) {
                url += `&q=${encodeURIComponent(query)}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
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
            headers: this.getHeaders(), // Use class method instead of getToken()
        });
        
        return await this.handleResponse(response);
    },
    
    addToCart: async (productId, quantity = 1) => {
        const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items`, {
            method: 'POST',
            headers: this.getHeaders(), // Use class method instead of getToken()
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
        
        return await this.handleResponse(response);
    },
    
    removeFromCart: async (itemId) => {
        const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: this.getHeaders(), // Use class method instead of getToken()
        });
        
        return await this.handleResponse(response);
    },
    
    updateCartItem: async (itemId, quantity) => {
        const response = await fetch(`${API_BASE_URL}/ecommerce/cart/items/${itemId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                quantity: quantity
            })
        });
        
        return await this.handleResponse(response);
    },
    
    clearCart: async () => {
        const response = await fetch(`${API_BASE_URL}/ecommerce/cart/clear`, {
            method: 'DELETE',
            headers: this.getHeaders(), // Use class method instead of getToken()
        });
        
        return await this.handleResponse(response);
    },


        // Place order from cart
        placeOrder: async (orderData) => {
            const response = await fetch(`${API_BASE_URL}/order/orders`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(orderData),
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
        getOrders: async (params = {}) => {
            const { status, page = 1, limit = 20, search } = params;
            let url = `${API_BASE_URL}/order/orders?page=${page}&per_page=${limit}`;
            
            if (status && status !== 'all') {
                url += `&status=${status}`;
            }
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        // Get user's own orders (same endpoint, but backend filters by user)
        getUserOrders: async (params = {}) => {
            return await this.order.getOrders(params);
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
        getPosts: async (category = null, region = null, type = null, status = null, userType = null, approvedOnly = false, page = 1, perPage = 20) => {
            let url = `${API_BASE_URL}/market/posts?page=${page}&per_page=${perPage}`;
            if (category) url += `&category=${category}`;
            if (region) url += `&region=${region}`;
            if (type) url += `&type=${type}`;
            if (status) url += `&status=${status}`;
            if (userType) url += `&user_type=${userType}`;
            if (approvedOnly) url += `&approved_only=true`;

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
                if (postData[key] !== null && postData[key] !== undefined) {
                    formData.append(key, postData[key]);
                }
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

        // Approve market post
        approvePost: async (postId) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}/approve`, {
                method: 'POST',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Express interest in a post
        expressInterest: async (postId, interestData) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}/interest`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(interestData),
            });

            return await this.handleResponse(response);
        },

        // Get interests for a post
        getPostInterests: async (postId) => {
            const response = await fetch(`${API_BASE_URL}/market/posts/${postId}/interests`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Accept an interest
        acceptInterest: async (interestId) => {
            const response = await fetch(`${API_BASE_URL}/market/interests/${interestId}/accept`, {
                method: 'POST',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Get market statistics
        getStats: async () => {
            const response = await fetch(`${API_BASE_URL}/market/stats`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        },

        // Legacy compatibility methods
        getNeeds: async () => {
            return await agriConnectAPI.market.getPosts(null, null, 'need');
        },

        getDeals: async () => {
            const userId = agriConnectAPI.getUserId();
            return await agriConnectAPI.market.getPosts(null, null, 'need', 'closed');
        },

        createNeed: async (needData) => {
            const postData = { ...needData, type: 'need' };
            return await agriConnectAPI.market.createPost(postData, []);
        },

        deleteNeed: async (needId) => {
            return await agriConnectAPI.market.deletePost(needId);
        },

        updateNeed: async (needId, needData) => {
            return await agriConnectAPI.market.updatePost(needId, needData);
        },

        rejectPost: async (postId) => {
            return await agriConnectAPI.market.updatePost(postId, { status: 'rejected' });
        },

        requestPurchase: async (postId, message = '') => {
            return await agriConnectAPI.market.expressInterest(postId, { message });
        },

        updateDeal: async (dealId, dealData) => {
            return await agriConnectAPI.market.updatePost(dealId, dealData);
        },

        acceptNeed: async (needId, userId) => {
            return await agriConnectAPI.market.updatePost(needId, { accepted_by: userId, status: 'closed' });
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

    // Create SACCO (admin only)
    createSacco: async (saccoData) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/sacco/saccos`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(saccoData),
        });

        return await this.handleResponse(response);
    },

    // Update SACCO (admin only)
    updateSacco: async (saccoId, saccoData) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(saccoData),
        });

        return await this.handleResponse(response);
    },

    // Delete SACCO (admin only)
    deleteSacco: async (saccoId) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return await this.handleResponse(response);
    },

    // Create a new SACCO (admin only)
    createSacco: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/sacco/saccos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        });

        return await this.handleResponse(response);
    },

    // Update SACCO (admin only)
    updateSacco: async (saccoId, formData) => {
        const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        });

        return await this.handleResponse(response);
    },

    // Deactivate SACCO (admin only)
    deactivateSacco: async (saccoId) => {
        const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}/deactivate`, {
            method: 'PUT',
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

    // Update loan application status
    updateLoanStatus: async (applicationId, statusData) => {
        const response = await fetch(`${API_BASE_URL}/sacco/loan-applications/${applicationId}/status`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(statusData),
        });

        return await this.handleResponse(response);
    },

    // Process member deposit (admin only)
    processDeposit: async (memberId, depositData) => {
        console.log('API: processDeposit called with:', { memberId, depositData });
        console.log('API: Current token:', this.token ? 'Present' : 'Missing');
        
        const response = await fetch(`${API_BASE_URL}/sacco/members/${memberId}/deposit`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(depositData),
        });

        console.log('API: Response status:', response.status);
        console.log('API: Response headers:', Object.fromEntries(response.headers.entries()));
        
        const result = await this.handleResponse(response);
        console.log('API: Response data:', result);
        return result;
    },

    // Get SACCO members (admin only)
    getSaccoMembers: async (saccoId) => {
        const response = await fetch(`${API_BASE_URL}/sacco/saccos/${saccoId}/members`, {
            method: 'GET',
            headers: agriConnectAPI.getHeaders(),
        });

        return await agriConnectAPI.handleResponse(response);
    },

    // Process savings transaction (user)
    processSavingsTransaction: async (transactionData) => {
        console.log('API: processSavingsTransaction called with:', transactionData);
        console.log('API: Current token:', agriConnectAPI.token ? 'Present' : 'Missing');
        
        const response = await fetch(`${API_BASE_URL}/sacco/savings/transaction`, {
            method: 'POST',
            headers: agriConnectAPI.getHeaders(),
            body: JSON.stringify(transactionData),
        });

        console.log('API: Response status:', response.status);
        const result = await agriConnectAPI.handleResponse(response);
        console.log('API: Response data:', result);
        return result;
    },
};

    // Agroclimate API calls
agroclimate = {
    // Get all regions
    getRegions: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/agroclimate/regions`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch regions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching regions:', error);
            return { regions: [] };
        }
    },

    // Get specific region
    getRegion: async (regionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/agroclimate/regions/${regionId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch region');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching region:', error);
            return null;
        }
    },

    // Create region (admin only)
    createRegion: async (regionData) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/regions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(regionData),
        });
        return await this.handleResponse(response);
    },

    // Update region (admin only)
    updateRegion: async (regionId, regionData) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/regions/${regionId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(regionData),
        });
        return await this.handleResponse(response);
    },

    // Delete region (admin only)
    deleteRegion: async (regionId) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/regions/${regionId}`, {
            method: 'DELETE',
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

    // Create crop recommendation (admin only) - MISSING METHOD
    createCropRecommendation: async (recommendationData) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/crop-recommendations`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(recommendationData),
        });
        return await this.handleResponse(response);
    },

    // Update crop recommendation (admin only) - MISSING METHOD
    updateCropRecommendation: async (recommendationId, recommendationData) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/crop-recommendations/${recommendationId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(recommendationData),
        });
        return await this.handleResponse(response);
    },

    // Delete crop recommendation (admin only) - MISSING METHOD
    deleteCropRecommendation: async (recommendationId) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/crop-recommendations/${recommendationId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return await this.handleResponse(response);
    },

    // Get all crop recommendations (admin overview)
    getAllCropRecommendations: async (page = 1, perPage = 50) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/crop-recommendations?page=${page}&per_page=${perPage}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return await this.handleResponse(response);
    },

    // Create weather data (admin only)
    createWeatherData: async (weatherData) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/weather`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(weatherData),
        });
        return await this.handleResponse(response);
    },

    // Get seasonal advice
    getSeasonalAdvice: async (regionId, month) => {
        const response = await fetch(`${API_BASE_URL}/agroclimate/seasonal-advice/${regionId}?month=${month}`, {
            method: 'GET',
            headers: this.getHeaders(),
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
            // If videoData is FormData (file upload), don't set Content-Type header
            const isFormData = videoData instanceof FormData;
            const headers = isFormData 
                ? { 'Authorization': `Bearer ${this.token}` } 
                : this.getHeaders();
            
            const response = await fetch(`${API_BASE_URL}/skill/videos`, {
                method: 'POST',
                headers: headers,
                body: isFormData ? videoData : JSON.stringify(videoData),
            });

            return await this.handleResponse(response);
        },

         // Update skill (admin only) - MISSING METHOD
    updateSkill: async (skillId, skillData) => {
        const response = await fetch(`${API_BASE_URL}/skill/skills/${skillId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(skillData),
        });

        return await this.handleResponse(response);
    },

    // Delete skill (admin only)
    deleteSkill: async (skillId) => {
        const response = await fetch(`${API_BASE_URL}/skill/skills/${skillId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return await this.handleResponse(response);
    },

    // Get skill categories
    getSkillCategories: async () => {
        const response = await fetch(`${API_BASE_URL}/skill/categories`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return await this.handleResponse(response);
    },

    // Create skill category (admin only)
    createSkillCategory: async (categoryData) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/skill/categories`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(categoryData),
        });

        return await this.handleResponse(response);
    },

    // Update skill category (admin only)
    updateSkillCategory: async (categoryId, categoryData) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/skill/categories/${categoryId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(categoryData),
        });

        return await this.handleResponse(response);
    },

    // Delete skill category (admin only)
    deleteSkillCategory: async (categoryId) => {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        const response = await fetch(`${API_BASE_URL}/skill/categories/${categoryId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
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

    // Create warehouse (admin only) - MISSING METHOD
    createWarehouse: async (warehouseData) => {
        const response = await fetch(`${API_BASE_URL}/storage/warehouses`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(warehouseData),
        });

        return await this.handleResponse(response);
    },

    // Update warehouse (admin only) - MISSING METHOD
    updateWarehouse: async (warehouseId, warehouseData) => {
        const response = await fetch(`${API_BASE_URL}/storage/warehouses/${warehouseId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(warehouseData),
        });

        return await this.handleResponse(response);
    },

    // Update warehouse status (admin only) - MISSING METHOD
    updateWarehouseStatus: async (warehouseId, isActive) => {
        const response = await fetch(`${API_BASE_URL}/storage/warehouses/${warehouseId}/status`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ is_active: isActive }),
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

    // Notifications API calls (placeholder)
    notifications = {
        // Notify farmers about new market needs
        notifyFarmers: async (type, data) => {
            // TODO: Implement notifications endpoint in backend
            console.log(`Notification to farmers: ${type}`, data);
            // For now, just return success - this would normally send notifications
            return { success: true, message: 'Farmers notified' };
        },

        // Notify admins about need acceptance
        notifyAdmins: async (type, data) => {
            // TODO: Implement notifications endpoint in backend
            console.log(`Notification to admins: ${type}`, data);
            // For now, just return success - this would normally send notifications
            return { success: true, message: 'Admins notified' };
        },

        // Notify specific user
        notifyUser: async (userId, type, data) => {
            // TODO: Implement notifications endpoint in backend
            console.log(`Notification to user ${userId}: ${type}`, data);
            // For now, just return success - this would normally send notifications
            return { success: true, message: 'User notified' };
        }
    };

    // Dashboard API methods
    dashboard = {
        getUserDashboard: async () => {
            const response = await fetch(`${API_BASE_URL}/dashboard/user/overview`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        getAdminDashboard: async () => {
            if (!this.isAdmin()) {
                throw new Error('Admin access required');
            }

            const response = await fetch(`${API_BASE_URL}/dashboard/admin/overview`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        getPolicies: async () => {
            const response = await fetch(`${API_BASE_URL}/dashboard/policies`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        },

        getFeatures: async () => {
            const response = await fetch(`${API_BASE_URL}/dashboard/features`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        }
    };
}

// Create a singleton instance
const agriConnectAPI = new AgriConnectAPI();

// Export both default and named export
export default agriConnectAPI;
export { agriConnectAPI };