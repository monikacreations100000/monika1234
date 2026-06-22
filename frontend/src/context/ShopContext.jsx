import React, { createContext, useState, useEffect } from 'react';
import BASE_API_URL from '../config/api';

export const ShopContext = createContext(null);

export const ShopContextProvider = ({ children }) => {
  const API_URL = (BASE_API_URL || '').replace(/\/$/, '') + '/api';

  // State Declarations
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ online: true, type: 'Live Database' });
  const [deletedProductIds, setDeletedProductIds] = useState(() => {
    const saved = localStorage.getItem('deletedProductIds');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('deletedProductIds', JSON.stringify(deletedProductIds));
  }, [deletedProductIds]);
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Auth State
  const [userInfo, setUserInfo] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });

  // Cart State
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // UPI Settings State
  const [upiId, setUpiId] = useState(localStorage.getItem('upiId') || 'sethswayam21@okaxis');
  const [qrCode, setQrCode] = useState(localStorage.getItem('qrCode') || '');

  // Load UPI Settings from backend on initialization
  useEffect(() => {
    const fetchUpiSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/upi`);
        if (response.ok) {
          const data = await response.json();
          if (data.upiId) {
            setUpiId(data.upiId);
            localStorage.setItem('upiId', data.upiId);
          }
          if (data.qrCode !== undefined) {
            setQrCode(data.qrCode);
            localStorage.setItem('qrCode', data.qrCode);
          }
        }
      } catch (err) {
        console.warn('Failed to load UPI settings from backend:', err.message);
      }
    };
    fetchUpiSettings();
  }, []);

  const updateUpiSettings = async (newUpiId, newQrCode) => {
    setUpiId(newUpiId);
    localStorage.setItem('upiId', newUpiId);
    setQrCode(newQrCode);
    localStorage.setItem('qrCode', newQrCode);

    try {
      await fetch(`${API_URL}/settings/upi`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify({ upiId: newUpiId, qrCode: newQrCode })
      });
    } catch (err) {
      console.error('Failed to sync UPI settings to backend:', err.message);
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Set theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync Cart Items to LocalStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Auto-remove deleted products from the shopping cart
  useEffect(() => {
    if (!loading && products.length > 0) {
      setCartItems(prev => {
        const filtered = prev.filter(item => 
          products.some(p => p._id === item.product) && !deletedProductIds.includes(item.product)
        );
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }
  }, [products, loading, deletedProductIds]);

  // Test backend status and fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?_t=${Date.now()}`);
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('API server unreachable');
      }
      const data = await response.json();
      const productsList = (data && data.success && Array.isArray(data.products))
        ? data.products
        : (Array.isArray(data) ? data : []);
      setProducts(productsList);
      setBackendStatus({ online: true, type: 'Live Database' });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products from live database:', err.message);
      setError('Could not connect to live database. Please check your network connection.');
      setProducts([]);
      setBackendStatus({ online: false, type: 'Offline' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('API server unreachable');
      }

      const data = await response.json();
      setUserInfo(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      console.error('API login failed:', err.message);
      let cleanMsg = err.message;
      if (cleanMsg.includes('Unexpected token') || cleanMsg.includes('not valid JSON') || cleanMsg.includes('JSON') || cleanMsg.includes('unreachable') || cleanMsg.includes('Failed to fetch')) {
        cleanMsg = 'Invalid email or password';
      }
      throw new Error(cleanMsg || 'Invalid email or password');
    }
  };

  const registerUser = async (name, email, password, phone) => {
    try {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: cleanEmail, password, phone })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('API server unreachable');
      }

      const data = await response.json();
      setUserInfo(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error('API registration failed:', err.message);
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logoutUser = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
    setCartItems([]);
  };

  // Cart Operations
  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(item => item.product === product._id);
      if (existing) {
        return prev.map(item =>
          item.product === product._id
            ? { ...item, qty: Math.min(product.stock, item.qty + qty) }
            : item
        );
      }
      return [...prev, {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty,
        stock: product.stock
      }];
    });
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map(item =>
        item.product === productId ? { ...item, qty } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter(item => item.product !== productId));
  };

  const getCartCount = () => {
    return cartItems.reduce((acc, item) => acc + item.qty, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  };

  // Product Admin Operations (CRUD API only)
  const addProduct = async (productData) => {
    try {
      console.log('--- ADD PRODUCT REQUEST ---');
      console.log('Payload:', productData);
      console.log('Token exists:', !!userInfo?.token);

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(productData)
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = 'Failed to create product';
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (contentType && contentType.includes('application/json')) {
        const serverProduct = await response.json();
        console.log('Product created successfully:', serverProduct);
        await fetchProducts();
        return serverProduct;
      }
    } catch (err) {
      console.error('API create product failed:', err.message);
      throw err;
    }
  };

  const editProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(productData)
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = 'Failed to update product';
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (contentType && contentType.includes('application/json')) {
        const serverProduct = await response.json();
        console.log('Product updated successfully:', serverProduct);
        await fetchProducts();
        return serverProduct;
      }
    } catch (err) {
      console.error('API edit product failed:', err.message);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    setDeletedProductIds(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = 'Failed to delete product';
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('API delete product failed:', err.message);
      throw err;
    }
  };

  const resetProducts = () => {
    setDeletedProductIds([]);
    localStorage.removeItem('deletedProductIds');
    fetchProducts();
  };

  // Order Operations
  const placeOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to place order');
      const data = await response.json();
      
      await fetchProducts();
      setCartItems([]);
      setAppliedCoupon(null);
      return data;
    } catch (err) {
      console.error('API place order failed:', err.message);
      throw err;
    }
  };

  const getOrderDetails = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch order details');
      return await response.json();
    } catch (err) {
      console.error('API get order details failed:', err.message);
      throw err;
    }
  };

  const payOrder = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to update payment status');
      return await response.json();
    } catch (err) {
      console.error('API pay order failed:', err.message);
      throw err;
    }
  };

  const deliverOrder = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/deliver`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to update delivery status');
      return await response.json();
    } catch (err) {
      console.error('API deliver order failed:', err.message);
      throw err;
    }
  };

  const getAllOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch all orders');
      return await response.json();
    } catch (err) {
      console.error('API get all orders failed:', err.message);
      throw err;
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch all users');
      return await response.json();
    } catch (err) {
      console.error('API get all users failed:', err.message);
      throw err;
    }
  };

  // Coupon Operations
  const getCoupons = async () => {
    try {
      const response = await fetch(`${API_URL}/coupons`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return await response.json();
    } catch (err) {
      console.error('API get coupons failed:', err.message);
      throw err;
    }
  };

  const createCoupon = async (couponData) => {
    try {
      const response = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(couponData)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create coupon');
      }
      return await response.json();
    } catch (err) {
      console.error('API create coupon failed:', err.message);
      throw err;
    }
  };

  const toggleCoupon = async (id) => {
    try {
      const response = await fetch(`${API_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to toggle coupon status');
      return await response.json();
    } catch (err) {
      console.error('API toggle coupon status failed:', err.message);
      throw err;
    }
  };

  const deleteCoupon = async (id) => {
    try {
      const response = await fetch(`${API_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete coupon');
      return await response.json();
    } catch (err) {
      console.error('API delete coupon failed:', err.message);
      throw err;
    }
  };

  const validateCoupon = async (code, subtotal) => {
    try {
      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, subtotal })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Invalid coupon');
      }
      return await response.json();
    } catch (err) {
      console.error('API validate coupon failed:', err.message);
      throw err;
    }
  };

  const addProductReview = async (id, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.message || 'Failed to submit review');
      }
      await fetchProducts();
      return { success: true };
    } catch (err) {
      console.error('API submit review failed:', err.message);
      throw err;
    }
  };

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('API upload file failed response:', errData);
        throw new Error(errData.message || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('File upload failed error:', err.message);
      throw err;
    }
  };

  const uploadMultipleFiles = async (files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/upload/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('API upload multiple files failed response:', errData);
        throw new Error(errData.message || 'Multiple upload failed');
      }

      const data = await response.json();
      return data.urls;
    } catch (err) {
      console.error('Multiple file upload failed error:', err.message);
      throw err;
    }
  };

  return (
    <ShopContext.Provider
      value={{
        API_URL,
        products: products.filter(p => !deletedProductIds.includes(p._id)),
        loading,
        error,
        backendStatus,
        fetchProducts,
        theme,
        toggleTheme,
        userInfo,
        loginUser,
        registerUser,
        logoutUser,
        cartItems,
        addToCart,
        updateCartQty,
        removeFromCart,
        getCartCount,
        getCartTotal,
        addProduct,
        editProduct,
        deleteProduct,
        resetProducts,
        placeOrder,
        getOrderDetails,
        payOrder,
        deliverOrder,
        getAllOrders,
        getAllUsers,
        addProductReview,
        uploadFile,
        uploadMultipleFiles,
        appliedCoupon,
        setAppliedCoupon,
        getCoupons,
        createCoupon,
        toggleCoupon,
        deleteCoupon,
        validateCoupon,
        upiId,
        qrCode,
        updateUpiSettings
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
