const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hàm tạo token
const generateToken = (user) => {
  // Dùng fallback trong môi trường dev để tránh lỗi cấu hình
  const secret = process.env.JWT_SECRET || 'dev_fallback_jwt_secret_change_me';
  if (!process.env.JWT_SECRET) {
    console.warn('[Auth] JWT_SECRET is not set. Using a development fallback secret. Please configure JWT_SECRET in .env for production.');
  }
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Đăng ký
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã tồn tại.' });
    }

    // Hash password đã được xử lý tự động bởi hook trong model User
    const newUser = await User.create({ 
      name: name.trim(), 
      email: normalizedEmail, 
      password 
    });

    const token = generateToken(newUser);
    res.status(201).json({
      status: 'success',
      token,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email này đã tồn tại.' });
    }
    next(error);
  }
};

// Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email - try both normalized and original (for existing users)
    let user = await User.findOne({ 
      where: { 
        email: normalizedEmail 
      } 
    });
    
    // If not found with normalized email, try original email (for backward compatibility)
    if (!user) {
      user = await User.findOne({ 
        where: { 
          email: email.trim() 
        } 
      });
    }

    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Compare password
    let isPasswordValid = false;
    try {
      isPasswordValid = await user.comparePassword(password);
    } catch (compareError) {
      console.error('Password comparison error:', compareError);
      return res.status(500).json({ message: 'Lỗi xác thực mật khẩu' });
    }
    
    if (!isPasswordValid) {
      console.log(`Login attempt failed: Invalid password for email: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate token
    const token = generateToken(user);
    res.status(200).json({
      status: 'success',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};