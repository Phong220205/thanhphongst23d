const db = require('../models');
const Product = db.Product;
const ProductVariant = db.ProductVariant;
const Category = db.Category;
const { Op } = require('sequelize');

// Lấy tất cả sản phẩm (có phân trang, lọc)
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Category, as: 'category' },
        { 
          model: ProductVariant, 
          as: 'variants' 
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true,
      // --- THAM SỐ CỰC KỲ QUAN TRỌNG ĐỂ KHẮC PHỤC LỖI COUNT VỚI INCLUDE ---
      subQuery: false // <-- THÊM DÒNG NÀY
    });

    res.status(200).json({
      status: 'success',
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    // Rất quan trọng: Nếu có lỗi SQL, phải trả về lỗi 500 ở đây
    console.error("Lỗi khi lấy sản phẩm:", error); 
    res.status(500).json({ status: 'error', message: 'Lỗi server khi truy vấn sản phẩm.', details: error.message });
    // next(error); // Tạm thời comment out next(error) để trả về response 500 rõ ràng
  }
};
// Lấy 1 sản phẩm CHI TIẾT
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { 
          model: ProductVariant, 
          as: 'variants' // Lấy tất cả biến thể (size, màu, tồn kho...)
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};

// [ADMIN] Tạo sản phẩm (logic phức tạp hơn)
exports.createProduct = async (req, res, next) => {
  // req.body sẽ có dạng:
  // {
  //   name: "Áo sơ mi",
  //   description: "...",
  //   categoryId: 1,
  //   variants: [
  //     { color: "Trắng", size: "M", price: 200, stock: 10 },
  //     { color: "Đen", size: "L", price: 210, stock: 5 }
  //   ]
  // }
  const t = await db.sequelize.transaction(); // Bắt đầu transaction
  try {
    const { name, description, brand, categoryId, variants } = req.body;

    // 1. Tạo Product
    const newProduct = await Product.create({
      name,
      description,
      brand,
      categoryId
    }, { transaction: t });

    // 2. Thêm productId vào từng variant và tạo chúng
    if (variants && variants.length > 0) {
      const variantsWithProductId = variants.map(v => ({
        ...v,
        productId: newProduct.id
      }));
      await ProductVariant.bulkCreate(variantsWithProductId, { transaction: t });
    }

    // Nếu mọi thứ OK, commit transaction
    await t.commit();

    // Lấy lại data đầy đủ để trả về
    const finalProduct = await Product.findByPk(newProduct.id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    res.status(201).json({ status: 'success', data: finalProduct });
  } catch (error) {
    // Nếu có lỗi, rollback
    await t.rollback();
    next(error);
  }
};

// [ADMIN] Cập nhật sản phẩm
exports.updateProduct = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description, brand, categoryId, variants } = req.body;

    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Cập nhật thông tin sản phẩm
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      brand: brand || product.brand,
      categoryId: categoryId || product.categoryId
    }, { transaction: t });

    // Nếu có variants mới, cập nhật chúng
    if (variants && Array.isArray(variants)) {
      // Xóa các variants cũ
      await ProductVariant.destroy({
        where: { productId: id },
        transaction: t
      });

      // Tạo lại variants mới
      if (variants.length > 0) {
        const variantsWithProductId = variants.map(v => ({
          ...v,
          productId: id
        }));
        await ProductVariant.bulkCreate(variantsWithProductId, { transaction: t });
      }
    }

    await t.commit();

    // Lấy lại data đầy đủ
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductVariant, as: 'variants' }
      ]
    });

    res.status(200).json({ status: 'success', data: updatedProduct });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// [ADMIN] Xóa sản phẩm
exports.deleteProduct = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Xóa variants trước (do foreign key constraint)
    await ProductVariant.destroy({
      where: { productId: id },
      transaction: t
    });

    // Xóa sản phẩm
    await product.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({ status: 'success', message: 'Sản phẩm đã được xóa thành công' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};