'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
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
  };

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
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Không thể gửi đánh giá';
      toast.error(errorMessage);
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
    } catch (error: any) {
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
    return <div className="mt-8">Đang tải đánh giá...</div>;
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
            <span className="text-lg font-semibold text-gray-900">{averageRating}</span>
            <span className="text-gray-500">({totalReviews} đánh giá)</span>
          </div>
        </div>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className={`text-2xl ${
                      rating <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ rating: 5, comment: '' });
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-gray-500 mb-6">
          <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Đăng nhập
          </a>{' '}
          để viết đánh giá
        </p>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold text-gray-900">{review.user.name}</div>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  )}
                </div>
                {isAuthenticated && (user?.id === review.user.id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-sm text-red-600 hover:text-red-700"
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

