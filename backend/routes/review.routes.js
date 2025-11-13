const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

// Tạo review (yêu cầu đăng nhập)
router.post('/', protect, reviewController.createReview);

// Lấy tất cả reviews của một sản phẩm (không cần đăng nhập)
router.get('/product/:productId', reviewController.getProductReviews);

// Xóa review (yêu cầu đăng nhập)
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;

