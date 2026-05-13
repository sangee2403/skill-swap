const pool = require('../config/db');

// ─── GET PROFILE ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, skills_offered, skills_needed,
              wallet_address, bio, profile_picture, is_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { wallet_address, skills_offered, skills_needed, bio } = req.body;

    const offeredArr = Array.isArray(skills_offered)
      ? skills_offered
      : (skills_offered || '').split(',').map(s => s.trim()).filter(Boolean);

    const neededArr = Array.isArray(skills_needed)
      ? skills_needed
      : (skills_needed || '').split(',').map(s => s.trim()).filter(Boolean);

    const updated = await pool.query(
      `UPDATE users
       SET wallet_address = $1, skills_offered = $2, skills_needed = $3,
           bio = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, skills_offered, skills_needed, wallet_address, bio, is_verified`,
      [wallet_address || null, offeredArr, neededArr, bio || null, req.user.id]
    );

    res.json({ message: 'Profile updated!', user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── FIND MATCHES ─────────────────────────────────────────────────────────────
exports.findMatches = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Current user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentUser = userResult.rows[0];

    const myOffered = (currentUser.skills_offered || []).map(s =>
      s.toLowerCase().trim()
    );

    const myNeeded = (currentUser.skills_needed || []).map(s =>
      s.toLowerCase().trim()
    );

    // Get all other users
    const allUsers = await pool.query(
      'SELECT * FROM users WHERE id != $1',
      [userId]
    );

    const matches = allUsers.rows.filter(other => {
      const otherOffered = (other.skills_offered || []).map(s =>
        s.toLowerCase().trim()
      );

      const otherNeeded = (other.skills_needed || []).map(s =>
        s.toLowerCase().trim()
      );

      const iNeedWhatTheyOffer =
        myNeeded.some(skill => otherOffered.includes(skill));

      const theyNeedWhatIOffer =
        myOffered.some(skill => otherNeeded.includes(skill));

      return iNeedWhatTheyOffer && theyNeedWhatIOffer;
    });

    res.json(matches);

  } catch (err) {
    console.error('Match Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET ALL USERS (admin / browse) ──────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, skills_offered, skills_needed, wallet_address, is_verified, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
