'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { reviewsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProductReviewsProps {
  productId: number;
}

const getErrorMessage = (error: unknown, fallback = 'Có lỗi xảy ra'): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<string>('0');
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await reviewsAPI.getByProduct(productId, { limit: 20 });
      if (response.status === 'success') {
        setReviews(response.data);
        setAverageRating(response.averageRating || '0');
        setTotalReviews(response.totalReviews || 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create({
        productId,
        rating: formData.rating,
        comment: formData.comment
      });
      toast.success('Đánh giá của bạn đã được gửi');
      setShowForm(false);
      setFormData({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(getErrorMessage(error, 'Không thể gửi đánh giá'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;

    try {
      await reviewsAPI.delete(reviewId);
      toast.success('Đã xóa đánh giá');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Không thể xóa đánh giá');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return <div className="mt-8 text-gray-400">Đang tải đánh giá...</div>;
  }

  return (
    <div className="mt-12 border-t border-gray-700 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Đánh giá sản phẩm</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
            <span className="text-lg font-semibold text-white">{averageRating}</span>
            <span className="text-gray-400">({totalReviews} đánh giá)</span>
          </div>
        </div>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/50"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Viết đánh giá của bạn</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Đánh giá *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className={`text-2xl transition-all hover:scale-110 ${
                      rating <= formData.rating ? 'text-yellow-400' : 'text-gray-500'
                    } hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nhận xét
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ rating: 5, comment: '' });
                }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-gray-400 mb-6">
          <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Đăng nhập
          </a>{' '}
          để viết đánh giá
        </p>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-700 pb-6 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold text-white">{review.user.name}</div>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 mt-2">{review.comment}</p>
                  )}
                </div>
                {isAuthenticated && (user?.id === review.user.id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

