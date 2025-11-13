const db = require('../models');
const Review = db.Review;
const Product = db.Product;
const User = db.User;

// Tạo review mới
exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !rating) {
      return res.status(400).json({ message: 'Vui lòng cung cấp productId và rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: { userId, productId }
    });

    if (existingReview) {
      // Update existing review
      await existingReview.update({ rating, comment });
      const updatedReview = await Review.findByPk(existingReview.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
      });
      return res.status(200).json({
        status: 'success',
        message: 'Đánh giá đã được cập nhật',
        data: updatedReview
      });
    }

    // Create new review
    const newReview = await Review.create({
      userId,
      productId,
      rating,
      comment: comment || null
    });

    const reviewWithUser = await Review.findByPk(newReview.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({
      status: 'success',
      message: 'Đánh giá đã được thêm',
      data: reviewWithUser
    });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }
    next(error);
  }
};

// Lấy tất cả reviews của một sản phẩm
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    // Calculate average rating
    const allReviews = await Review.findAll({
      where: { productId },
      attributes: ['rating']
    });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    res.status(200).json({
      status: 'success',
      averageRating: avgRating.toFixed(1),
      totalReviews: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    next(error);
  }
};

// Xóa review (chỉ user tạo review mới xóa được)
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Check if user owns this review or is admin
    if (review.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này' });
    }

    await review.destroy();
    res.status(200).json({
      status: 'success',
      message: 'Đánh giá đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    next(error);
  }
};

