const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Lấy danh sách sản phẩm
router.get('/', productController.getAllProducts);

// === ADMIN ROUTES (must come before /:id to avoid route conflicts) ===
router.post('/', protect, isAdmin, productController.createProduct);

// Lấy chi tiết sản phẩm (must come after POST to avoid conflicts)
router.get('/:id', productController.getProductById);

// === ADMIN ROUTES (update/delete) ===
router.put('/:id', protect, isAdmin, productController.updateProduct);
router.delete('/:id', protect, isAdmin, productController.deleteProduct);

module.exports = router;