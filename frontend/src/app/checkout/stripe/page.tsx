'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Script from 'next/script';

declare global {
  interface Window {
    Stripe: any;
  }
}

function StripeCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stripe, setStripe] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!orderId || !amount) {
      toast.error('Thông tin đơn hàng không hợp lệ');
      router.push('/cart');
      return;
    }

    initializePayment();
  }, [isAuthenticated, orderId, amount, router]);

  const initializePayment = async () => {
    try {
      const response = await paymentAPI.createIntent({
        orderId: parseInt(orderId!),
        amount: parseFloat(amount!)
      });

      if (response.status === 'success') {
        setClientSecret(response.clientSecret);
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      const errorMessage = error.response?.data?.message || 'Không thể khởi tạo thanh toán';
      toast.error(errorMessage);
      // If Stripe is not configured, redirect back to checkout
      if (error.response?.status === 503) {
        router.push('/checkout');
      } else {
        router.push('/checkout');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.Stripe && clientSecret) {
      const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
      setStripe(stripeInstance);

      const elements = stripeInstance.elements({ clientSecret });
      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');

      return () => {
        paymentElement.unmount();
      };
    }
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !clientSecret) return;

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: stripe.elements({ clientSecret }),
        confirmParams: {
          return_url: typeof window !== 'undefined' 
            ? `${window.location.origin}/checkout/success?orderId=${orderId}`
            : `/checkout/success?orderId=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Thanh toán thất bại');
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await paymentAPI.confirm({
          paymentIntentId: paymentIntent.id,
          orderId: parseInt(orderId!)
        });
        toast.success('Thanh toán thành công!');
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Có lỗi xảy ra khi thanh toán');
      setLoading(false);
    }
  };

  if (loading && !clientSecret) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-500">Đang khởi tạo thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán bằng thẻ</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div id="payment-element" className="bg-white p-6 rounded-lg border"></div>

          <button
            type="submit"
            disabled={loading || !stripe}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </form>
      </div>
    </>
  );
}

export default function StripeCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-500">Đang tải...</p>
        </div>
      </div>
    }>
      <StripeCheckoutContent />
    </Suspense>
  );
}

