const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, skills_offered, skills_needed, wallet_address } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Username, email and password are required' });
    }

    // Check existing user
    const userExist = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExist.rows.length > 0) {
      return res.status(400).json({ msg: 'User with this email or username already exists' });
    }

    // Hash password
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // skills_offered / skills_needed - accept array or comma-string
    const offeredArr = Array.isArray(skills_offered)
      ? skills_offered
      : (skills_offered || '').split(',').map(s => s.trim()).filter(Boolean);

    const neededArr = Array.isArray(skills_needed)
      ? skills_needed
      : (skills_needed || '').split(',').map(s => s.trim()).filter(Boolean);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, skills_offered, skills_needed, wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, skills_offered, skills_needed, wallet_address, created_at`,
      [username, email, hashedPassword, offeredArr, neededArr, wallet_address || null]
    );

    res.status(201).json({
      message : 'User registered successfully!',
      user    : newUser.rows[0]
    });

  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ msg: 'Server Error in Registration', error: err.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const user    = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'my_super_secret_key_123',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id             : user.id,
        username       : user.username,
        email          : user.email,
        skills_offered : user.skills_offered,
        skills_needed  : user.skills_needed,
        wallet_address : user.wallet_address,
        is_verified    : user.is_verified
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ msg: 'Server Error in Login', error: err.message });
  }
};
