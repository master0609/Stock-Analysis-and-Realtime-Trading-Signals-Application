/**
 * Authentication service for handling user auth operations
 */

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies for JWT
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data
 */
export const register = async (name, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include', // Include cookies for JWT
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies for JWT
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Check if the user is authenticated
 * @returns {Promise<Object|null>} - User data if authenticated, null otherwise
 */
export const checkAuth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include', // Include cookies for JWT
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not authenticated
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};
