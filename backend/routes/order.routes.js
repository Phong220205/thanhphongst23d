const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Tạo đơn hàng mới (yêu cầu đăng nhập)
router.post('/', protect, orderController.createOrder);

// Lấy tất cả đơn hàng của user hiện tại
router.get('/my-orders', protect, orderController.getUserOrders);

// Lấy chi tiết một đơn hàng của user
router.get('/:id', protect, orderController.getOrderById);

// [ADMIN] Lấy tất cả đơn hàng
router.get('/', protect, isAdmin, orderController.getAllOrders);

// [ADMIN] Cập nhật trạng thái đơn hàng
router.patch('/:id/status', protect, isAdmin, orderController.updateOrderStatus);

module.exports = router;

