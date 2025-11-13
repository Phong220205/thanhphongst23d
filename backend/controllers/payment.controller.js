// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Stripe API key not found. Stripe payment features will be disabled.');
}

const db = require('../models');
const Order = db.Order;

// Tạo Stripe payment intent
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        message: 'Stripe payment is not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
      });
    }

    const { orderId, amount } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: { id: orderId, userId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng đã được xử lý' });
    }

    // Create payment intent
    // Note: Stripe doesn't support VND, so we convert to USD (divide by ~25000 VND/USD)
    // For production, use actual exchange rate API
    const amountInUSD = parseFloat(amount) / 25000;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountInUSD * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id.toString(),
        userId: userId.toString(),
        originalAmount: amount.toString()
      }
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    next(error);
  }
};

// Xác nhận thanh toán thành công
exports.confirmPayment = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        message: 'Stripe payment is not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
      });
    }

    const { paymentIntentId, orderId } = req.body;
    const userId = req.user.id;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Thanh toán chưa được xác nhận' });
    }

    // Verify order
    const order = await Order.findOne({
      where: { id: orderId, userId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Update order status
    await order.update({
      status: 'processing',
      paymentMethod: 'stripe'
    });

    res.status(200).json({
      status: 'success',
      message: 'Thanh toán thành công',
      data: order
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    next(error);
  }
};

// Webhook handler for Stripe (for production)
exports.stripeWebhook = async (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Stripe payment is not configured.' 
    });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({ 
      message: 'Stripe webhook secret is not configured.' 
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const order = await Order.findByPk(orderId);
        if (order) {
          await order.update({ status: 'processing', paymentMethod: 'stripe' });
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

