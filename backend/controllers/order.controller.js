const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const ProductVariant = db.ProductVariant;
const Product = db.Product;
const { Op } = require('sequelize');

// Tạo đơn hàng mới
exports.createOrder = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { items, paymentMethod, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng không được để trống' });
    }

    // Validate và tính tổng tiền
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const { variantId, quantity } = item;

      if (!variantId || !quantity || quantity <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Thông tin sản phẩm không hợp lệ' });
      }

      // Lấy thông tin variant và kiểm tra tồn kho
      const variant = await ProductVariant.findByPk(variantId, {
        include: [{ model: Product, as: 'product' }],
        transaction: t
      });

      if (!variant) {
        await t.rollback();
        return res.status(404).json({ message: `Không tìm thấy sản phẩm với ID: ${variantId}` });
      }

      if (variant.stock < quantity) {
        await t.rollback();
        return res.status(400).json({ 
          message: `Sản phẩm "${variant.product?.name || 'N/A'}" (${variant.color}, ${variant.size}) chỉ còn ${variant.stock} sản phẩm trong kho` 
        });
      }

      // Cập nhật tồn kho
      await variant.update(
        { stock: variant.stock - quantity },
        { transaction: t }
      );

      const itemTotal = parseFloat(variant.price) * quantity;
      total += itemTotal;

      orderItems.push({
        productVariantId: variantId,
        quantity,
        price: variant.price
      });
    }

    // Tạo đơn hàng
    const newOrder = await Order.create({
      userId,
      total: total.toFixed(2),
      status: 'pending',
      paymentMethod: paymentMethod || 'cod',
      shippingAddress: shippingAddress || null
    }, { transaction: t });

    // Tạo các order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      orderId: newOrder.id
    }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    await t.commit();

    // Lấy lại đơn hàng với đầy đủ thông tin
    const finalOrder = await Order.findByPk(newOrder.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      data: finalOrder
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating order:', error);
    next(error);
  }
};

// Lấy tất cả đơn hàng của user hiện tại
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = { userId };
    if (status) {
      whereCondition.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    next(error);
  }
};

// Lấy chi tiết một đơn hàng
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    next(error);
  }
};

// [ADMIN] Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }
    if (userId) {
      whereCondition.userId = userId;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    next(error);
  }
};

// [ADMIN] Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    await order.update({ status });

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    next(error);
  }
};

