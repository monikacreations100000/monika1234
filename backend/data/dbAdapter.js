const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const logQueryError = (operationName, err) => {
  console.error(`❌ [DATABASE QUERY ERROR] in ${operationName}:`, err.message || err, err.stack);
};

// --- USER OPERATIONS ---
const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (err) {
    logQueryError('findUserByEmail', err);
    return null;
  }
};

const createUser = async (userData) => {
  try {
    return await User.create(userData);
  } catch (err) {
    logQueryError('createUser', err);
    return null;
  }
};

const findUserById = async (id) => {
  try {
    return await User.findById(id);
  } catch (err) {
    logQueryError('findUserById', err);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    return await User.find({}).select('-password');
  } catch (err) {
    logQueryError('getAllUsers', err);
    return [];
  }
};

const updateUser = async (id, userData) => {
  try {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  } catch (err) {
    logQueryError('updateUser', err);
    return null;
  }
};

// --- PRODUCT OPERATIONS ---
const getAllProducts = async () => {
  try {
    const products = await Product.find({}).lean();
    return products || [];
  } catch (err) {
    logQueryError('getAllProducts', err);
    return [];
  }
};

const findProductById = async (id) => {
  try {
    return await Product.findById(id).lean();
  } catch (err) {
    logQueryError('findProductById', err);
    return null;
  }
};

const createProduct = async (productData) => {
  try {
    return await Product.create(productData);
  } catch (err) {
    logQueryError('createProduct', err);
    return null;
  }
};

const updateProduct = async (id, productData) => {
  try {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  } catch (err) {
    logQueryError('updateProduct', err);
    return null;
  }
};

const deleteProduct = async (id) => {
  try {
    const res = await Product.findByIdAndDelete(id);
    return !!res;
  } catch (err) {
    logQueryError('deleteProduct', err);
    return false;
  }
};

const addProductReview = async (productId, reviewData) => {
  try {
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
    return await Order.create(orderData);
  } catch (err) {
    logQueryError('createOrder', err);
    return null;
  }
};

const getOrdersByUser = async (userId) => {
  try {
    return await Order.find({ user: userId });
  } catch (err) {
    logQueryError('getOrdersByUser', err);
    return [];
  }
};

const findOrderById = async (id) => {
  try {
    return await Order.findById(id).populate('user', 'name email');
  } catch (err) {
    logQueryError('findOrderById', err);
    return null;
  }
};

const getAllOrders = async () => {
  try {
    return await Order.find({}).populate('user', 'name email');
  } catch (err) {
    logQueryError('getAllOrders', err);
    return [];
  }
};

const updateOrder = async (id, orderData) => {
  try {
    return await Order.findByIdAndUpdate(id, orderData, { new: true });
  } catch (err) {
    logQueryError('updateOrder', err);
    return null;
  }
};

// --- COUPON OPERATIONS ---
const getAllCoupons = async () => {
  try {
    return await Coupon.find({});
  } catch (err) {
    logQueryError('getAllCoupons', err);
    return [];
  }
};

const findCouponByCode = async (code) => {
  try {
    const codeUpper = code.trim().toUpperCase();
    return await Coupon.findOne({ code: codeUpper });
  } catch (err) {
    logQueryError('findCouponByCode', err);
    return null;
  }
};

const createCoupon = async (couponData) => {
  try {
    return await Coupon.create(couponData);
  } catch (err) {
    logQueryError('createCoupon', err);
    return null;
  }
};

const findCouponById = async (id) => {
  try {
    return await Coupon.findById(id);
  } catch (err) {
    logQueryError('findCouponById', err);
    return null;
  }
};

const updateCoupon = async (id, couponData) => {
  try {
    return await Coupon.findByIdAndUpdate(id, couponData, { new: true });
  } catch (err) {
    logQueryError('updateCoupon', err);
    return null;
  }
};

const deleteCoupon = async (id) => {
  try {
    const res = await Coupon.findByIdAndDelete(id);
    return !!res;
  } catch (err) {
    logQueryError('deleteCoupon', err);
    return false;
  }
};

const getSettings = async (key, defaultValue) => {
  try {
    const setting = await Settings.findOne({ key }).lean();
    return setting ? setting.value : defaultValue;
  } catch (err) {
    logQueryError('getSettings', err);
    return defaultValue;
  }
};

const updateSettings = async (key, value) => {
  try {
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
