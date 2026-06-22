const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const mockData = require('./mockData');

const mockSettings = {};

// Check database mode
const getDbMode = () => {
  if (global.useMockDb) return 'mock';
  return 'mongo';
};

const logQueryError = (operationName, err) => {
  console.error(`❌ [DATABASE QUERY ERROR] in ${operationName}:`, err.message || err, err.stack);
};

// --- USER OPERATIONS ---
const findUserByEmail = async (email) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.findUserByEmail(email);
    }
    return await User.findOne({ email });
  } catch (err) {
    logQueryError('findUserByEmail', err);
    return null;
  }
};

const createUser = async (userData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.createUser(userData);
    }
    return await User.create(userData);
  } catch (err) {
    logQueryError('createUser', err);
    return null;
  }
};

const findUserById = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.findUserById(id);
    }
    return await User.findById(id);
  } catch (err) {
    logQueryError('findUserById', err);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockUsers;
    }
    return await User.find({}).select('-password');
  } catch (err) {
    logQueryError('getAllUsers', err);
    return [];
  }
};

const updateUser = async (id, userData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      let index = mockData.mockUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        mockData.mockUsers[index] = { ...mockData.mockUsers[index], ...userData };
        return mockData.mockUsers[index];
      }
      return null;
    }
    return await User.findByIdAndUpdate(id, userData, { new: true });
  } catch (err) {
    logQueryError('updateUser', err);
    return null;
  }
};

// --- PRODUCT OPERATIONS ---
const getAllProducts = async () => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockProducts;
    }
    const products = await Product.find({}).lean();
    return products || [];
  } catch (err) {
    logQueryError('getAllProducts', err);
    return [];
  }
};

const findProductById = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockProducts.find(p => p._id === id);
    }
    return await Product.findById(id).lean();
  } catch (err) {
    logQueryError('findProductById', err);
    return null;
  }
};

const createProduct = async (productData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      const newId = 'prod_mock_' + Math.random().toString(36).substr(2, 9);
      const prod = {
        _id: newId,
        ...productData,
        rating: 4.5,
        numReviews: 0,
        reviews: [],
        createdAt: new Date().toISOString()
      };
      mockData.mockProducts.unshift(prod);
      return prod;
    }
    return await Product.create(productData);
  } catch (err) {
    logQueryError('createProduct', err);
    return null;
  }
};

const updateProduct = async (id, productData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      let index = mockData.mockProducts.findIndex(p => p._id === id);
      if (index !== -1) {
        mockData.mockProducts[index] = { ...mockData.mockProducts[index], ...productData };
        return mockData.mockProducts[index];
      }
      return null;
    }
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  } catch (err) {
    logQueryError('updateProduct', err);
    return null;
  }
};

const deleteProduct = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      mockData.mockProducts = mockData.mockProducts.filter(p => p._id !== id);
      return true;
    }
    const res = await Product.findByIdAndDelete(id);
    return !!res;
  } catch (err) {
    logQueryError('deleteProduct', err);
    return false;
  }
};

const addProductReview = async (productId, reviewData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      let product = mockData.mockProducts.find(p => p._id === productId);
      if (product) {
        const review = {
          _id: 'rev_mock_' + Math.random().toString(36).substr(2, 9),
          ...reviewData,
          createdAt: new Date().toISOString()
        };
        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        return product;
      }
      return null;
    }
    const product = await Product.findById(productId);
    if (product) {
      product.reviews.push(reviewData);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
      await product.save();
      return product;
    }
    return null;
  } catch (err) {
    logQueryError('addProductReview', err);
    return null;
  }
};

// --- ORDER OPERATIONS ---
const createOrder = async (orderData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      const newOrder = {
        _id: 'order_mock_' + Math.random().toString(36).substr(2, 9),
        ...orderData,
        isPaid: false,
        isDelivered: false,
        createdAt: new Date().toISOString()
      };
      mockData.mockOrders.unshift(newOrder);
      return newOrder;
    }
    return await Order.create(orderData);
  } catch (err) {
    logQueryError('createOrder', err);
    return null;
  }
};

const getOrdersByUser = async (userId) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockOrders.filter(o => o.user._id === userId || o.user === userId);
    }
    return await Order.find({ user: userId });
  } catch (err) {
    logQueryError('getOrdersByUser', err);
    return [];
  }
};

const findOrderById = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockOrders.find(o => o._id === id);
    }
    return await Order.findById(id).populate('user', 'name email');
  } catch (err) {
    logQueryError('findOrderById', err);
    return null;
  }
};

const getAllOrders = async () => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockOrders;
    }
    return await Order.find({}).populate('user', 'name email');
  } catch (err) {
    logQueryError('getAllOrders', err);
    return [];
  }
};

const updateOrder = async (id, orderData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      let index = mockData.mockOrders.findIndex(o => o._id === id);
      if (index !== -1) {
        mockData.mockOrders[index] = { ...mockData.mockOrders[index], ...orderData };
        return mockData.mockOrders[index];
      }
      return null;
    }
    return await Order.findByIdAndUpdate(id, orderData, { new: true });
  } catch (err) {
    logQueryError('updateOrder', err);
    return null;
  }
};

// --- COUPON OPERATIONS ---
const getAllCoupons = async () => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockCoupons;
    }
    return await Coupon.find({});
  } catch (err) {
    logQueryError('getAllCoupons', err);
    return [];
  }
};

const findCouponByCode = async (code) => {
  try {
    const mode = getDbMode();
    const codeUpper = code.trim().toUpperCase();
    if (mode === 'mock') {
      return mockData.mockCoupons.find(c => c.code === codeUpper);
    }
    return await Coupon.findOne({ code: codeUpper });
  } catch (err) {
    logQueryError('findCouponByCode', err);
    return null;
  }
};

const createCoupon = async (couponData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      const newCoupon = {
        _id: 'coupon_mock_' + Math.random().toString(36).substr(2, 9),
        ...couponData,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      mockData.mockCoupons.unshift(newCoupon);
      return newCoupon;
    }
    return await Coupon.create(couponData);
  } catch (err) {
    logQueryError('createCoupon', err);
    return null;
  }
};

const findCouponById = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockData.mockCoupons.find(c => c._id === id);
    }
    return await Coupon.findById(id);
  } catch (err) {
    logQueryError('findCouponById', err);
    return null;
  }
};

const updateCoupon = async (id, couponData) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      let index = mockData.mockCoupons.findIndex(c => c._id === id);
      if (index !== -1) {
        mockData.mockCoupons[index] = { ...mockData.mockCoupons[index], ...couponData };
        return mockData.mockCoupons[index];
      }
      return null;
    }
    return await Coupon.findByIdAndUpdate(id, couponData, { new: true });
  } catch (err) {
    logQueryError('updateCoupon', err);
    return null;
  }
};

const deleteCoupon = async (id) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      mockData.mockCoupons = mockData.mockCoupons.filter(c => c._id !== id);
      return true;
    }
    const res = await Coupon.findByIdAndDelete(id);
    return !!res;
  } catch (err) {
    logQueryError('deleteCoupon', err);
    return false;
  }
};

const getSettings = async (key, defaultValue) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      return mockSettings[key] !== undefined ? mockSettings[key] : defaultValue;
    }
    const setting = await Settings.findOne({ key }).lean();
    return setting ? setting.value : defaultValue;
  } catch (err) {
    logQueryError('getSettings', err);
    return defaultValue;
  }
};

const updateSettings = async (key, value) => {
  try {
    const mode = getDbMode();
    if (mode === 'mock') {
      mockSettings[key] = value;
      return value;
    }
    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
    return setting.value;
  } catch (err) {
    logQueryError('updateSettings', err);
    return null;
  }
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  getAllUsers,
  updateUser,
  getAllProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  createOrder,
  getOrdersByUser,
  findOrderById,
  getAllOrders,
  updateOrder,
  getAllCoupons,
  findCouponByCode,
  createCoupon,
  findCouponById,
  updateCoupon,
  deleteCoupon,
  getSettings,
  updateSettings
};
