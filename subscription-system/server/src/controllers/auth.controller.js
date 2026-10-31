const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CustomerModel = require('../models/customer.model');
const { validatePassword, generateToken } = require('../middleware/auth.middleware');

const AuthController = {
  /**
   * Register a new user (Customer by default, or Staff if Admin)
   */
  async register(req, res) {
    try {
      const { name, email, password, company, phone, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      // Strict Password Validation Rule: >8 chars, uppercase, lowercase, special character
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }

      // Check unique email constraint
      const existing = await CustomerModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      // Only an authenticated admin can create a staff member
      let assignedRole = 'customer';
      if (role && role.toLowerCase() === 'staff') {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Only administrators can create staff accounts' });
        }
        assignedRole = 'staff';
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await CustomerModel.create({
        name: name || email.split('@')[0],
        email,
        passwordHash,
        role: assignedRole,
        company: company || '',
        phone: phone || ''
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        token,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during registration' });
    }
  },

  /**
   * User login (Returns token and user role)
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await CustomerModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  },

  /**
   * Request password reset link
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Registered email is required' });
      }

      const user = await CustomerModel.findByEmail(email);
      if (!user) {
        // Return 200 for security to prevent user enumeration
        return res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been generated.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      await CustomerModel.updateResetToken(email, resetToken, expiresAt);

      return res.status(200).json({
        success: true,
        message: `A password reset link has been dispatched to ${email}`,
        reset_token: resetToken,
        reset_link: `http://localhost:3000/reset-password?token=${resetToken}`
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during password reset request' });
    }
  },

  /**
   * Execute password reset with token
   */
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
      }

      const passwordCheck = validatePassword(new_password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      const updated = await CustomerModel.resetPasswordWithToken(token, newHash);
      if (!updated) {
        return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
      }

      return res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during password reset' });
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req, res) {
    try {
      const user = await CustomerModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin: List staff members
   */
  async getStaff(req, res) {
    try {
      const staffList = await CustomerModel.getAll('staff');
      return res.status(200).json({ success: true, staff: staffList });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin: Create an internal staff account
   */
  async createStaff(req, res) {
    try {
      const { name, email, password, company = 'Brightloop Internal' } = req.body;

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof company !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'A valid email address is required' });
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }

      const existing = await CustomerModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const staff = await CustomerModel.create({
        name: name.trim(),
        email: email.trim(),
        passwordHash,
        role: 'staff',
        company: company.trim(),
        phone: ''
      });

      return res.status(201).json({
        success: true,
        message: 'Staff account created successfully',
        staff
      });
    } catch (err) {
      console.error('Staff creation error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during staff creation' });
    }
  }
};

module.exports = AuthController;
