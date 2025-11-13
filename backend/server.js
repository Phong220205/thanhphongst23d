require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
// const swaggerUi = require('swagger-ui-express'); // <<< COMMENT OUT
// const swaggerJsdoc = require('swagger-jsdoc'); // <<< COMMENT OUT
const db = require('./models');
const allRoutes = require('./routes');
// const errorHandler = require('./middleware/error.handler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware ===
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Swagger API Docs (COMMENTED OUT) ===
/* // <<< COMMENT OUT START
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clothing Store API',
      version: '1.0.0',
      description: 'API documentation for the Clothing Store E-commerce',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'], // Đường dẫn đến các file routes (đã xóa comment)
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
*/ // <<< COMMENT OUT END

// === Routes ===
app.use('/api', allRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Clothing Store API!');
});

// === Error Handler ===
app.use((err, req, res, next) => {
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
      message: 'Lỗi cơ sở dữ liệu'
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
});

// === Start Server & Sync DB ===
app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  
  // Check required environment variables
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET is not set. Authentication will not work properly.');
  }
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});