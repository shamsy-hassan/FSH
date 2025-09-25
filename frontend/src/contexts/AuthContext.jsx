import React, { createContext, useContext, useState, useEffect } from 'react';
import { agriConnectAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'user' or 'admin'
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('agriConnectToken'));

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agriConnectToken');
      const storedUser = localStorage.getItem('agriConnectUser');
      const storedUserType = localStorage.getItem('agriConnectUserType');
      
      console.log('Auth init - storedToken:', !!storedToken);
      console.log('Auth init - storedUser:', storedUser);
      console.log('Auth init - storedUserType:', storedUserType);
      
      if (storedToken && storedUser && storedUserType) {
        try {
          // Set user from localStorage first for immediate UI update
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserType(storedUserType);
          setToken(storedToken);
          
          // Verify token is still valid by fetching fresh user data
          const userData = await agriConnectAPI.auth.getProfile();
          console.log('Fresh user data:', userData);
          
          if (userData.type === 'user') {
            setUser(userData.user);
            localStorage.setItem('agriConnectUser', JSON.stringify(userData.user));
          } else if (userData.type === 'admin') {
            setUser(userData.admin);
            localStorage.setItem('agriConnectUser', JSON.stringify(userData.admin));
          }
          
          setUserType(userData.type);
          localStorage.setItem('agriConnectUserType', userData.type);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Only logout if error is unauthorized or token expired
          if (
            error?.response?.status === 401 ||
            error?.response?.status === 403 ||
            (typeof error === 'string' && (
              error.toLowerCase().includes('unauthorized') ||
              error.toLowerCase().includes('token')
            ))
          ) {
            logout();
          } else {
            // Keep user logged in, maybe show a warning
            console.warn('Non-auth error during auth init, keeping user logged in.');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Update API token when it changes
  useEffect(() => {
    if (token) {
      agriConnectAPI.token = token;
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success && data.access_token) {
        // Store user data based on type
        if (data.type === 'user') {
          setUser(data.user);
          setUserType('user');
          localStorage.setItem('agriConnectUser', JSON.stringify(data.user));
          localStorage.setItem('agriConnectUserType', 'user');
          localStorage.setItem('agriConnectUserId', data.user.id);
        } else if (data.type === 'admin') {
          setUser(data.admin);
          setUserType('admin');
          localStorage.setItem('agriConnectUser', JSON.stringify(data.admin));
          localStorage.setItem('agriConnectUserType', 'admin');
          localStorage.setItem('agriConnectUserId', data.admin.id);
        }
        
        setToken(data.access_token);
        // Store in localStorage
        localStorage.setItem('agriConnectToken', data.access_token);
        // Update API instance
        agriConnectAPI.token = data.access_token; // Ensure API always uses latest token
        
        return { 
          success: true, 
          user: data.user || data.admin,
          userType: data.type 
        };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    try {
      setLoading(true);
      
      // Handle both nested and flat data structures
      let userData, profileData;
      
      if (registrationData.user && registrationData.profile) {
        // Data is already structured (from Register.jsx)
        userData = registrationData;
      } else {
        // Data is flat (backwards compatibility)
        userData = {
          user: {
            username: registrationData.username,
            email: registrationData.email,
            password: registrationData.password,
            user_type: registrationData.user_type || 'farmer'
          },
          profile: {
            first_name: registrationData.first_name,
            last_name: registrationData.last_name,
            phone: registrationData.phone,
            address: registrationData.address,
            region: registrationData.region,
            farm_size: registrationData.farm_size ? parseFloat(registrationData.farm_size) : null,
            gender: registrationData.gender
          }
        };
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Register response:', data);

      if (response.ok) {
        return { 
          success: true, 
          message: data.message,
          user: data.user 
        };
      } else {
        return { 
          success: false, 
          error: data.error || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out');
    // Clear context state
    setUser(null);
    setUserType(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('agriConnectToken');
    localStorage.removeItem('agriConnectUser');
    localStorage.removeItem('agriConnectUserType');
    localStorage.removeItem('agriConnectUserId');
    
    // Clear API instance
    agriConnectAPI.token = null;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('agriConnectUser', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!token && !!user && !!userType;

  const value = {
    user,
    userType,
    token,
    login,
    register,
    logout,
    loading,
    updateUser,
    isAuthenticated,
    isAdmin: userType === 'admin',
    isUser: userType === 'user',
    isFarmer: userType === 'user' && user?.user_type === 'farmer',
    isSupplier: userType === 'user' && user?.user_type === 'supplier'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};