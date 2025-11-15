# Troubleshooting Guide

## Login Issues

### Problem: Getting 500 Internal Server Error when trying to log in

**Possible Causes:**

1. **JWT_SECRET not configured**
   - **Solution:** Add `JWT_SECRET` to your backend `.env` file:
     ```
     JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters
     JWT_EXPIRES_IN=7d
     ```
   - **Check:** Look at backend terminal for warning: "⚠️ WARNING: JWT_SECRET is not set"

2. **Database connection issue**
   - **Solution:** Ensure MySQL is running and database credentials are correct in `backend/config/config.json`

3. **Email case mismatch**
   - **Solution:** The code now handles this automatically, but if you registered with mixed case, try logging in with the exact email you used

4. **Password hashing issue**
   - **Solution:** If you registered before the fixes, you may need to reset your password or re-register

### How to Check Backend Logs

1. Look at the backend terminal output
2. Check for error messages starting with "Login error:" or "Error:"
3. The error handler will now show more detailed error messages

### Quick Fix Steps

1. **Check environment variables:**
   ```bash
   # In backend directory, check if .env exists and has JWT_SECRET
   cat .env | grep JWT_SECRET
   ```

2. **Restart backend server:**
   ```bash
   cd backend
   npm start
   # or
   node server.js
   ```

3. **Test with a new account:**
   - Try registering a new account
   - Then try logging in with that account

4. **Check database:**
   - Verify the user exists in the database
   - Check if password is hashed (should be a long string starting with $2a$)

### Common Error Messages

- **"JWT_SECRET is not configured"** → Add JWT_SECRET to .env
- **"Email hoặc mật khẩu không đúng"** → Wrong email/password or user doesn't exist
- **"Lỗi xác thực mật khẩu"** → Password comparison failed (check bcrypt)
- **"Không thể tạo token"** → JWT_SECRET issue

