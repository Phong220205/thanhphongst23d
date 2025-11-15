// Global error handler middleware
module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors?.map(e => e.message)
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu đã tồn tại'
    });
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cơ sở dữ liệu',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token không hợp lệ'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token đã hết hạn'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Có lỗi xảy ra trên server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

