const pool = require('../config/db');

// ─── CREATE SESSION ───────────────────────────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const { guest_id, skill_topic } = req.body;
    const host_id = req.user.id;

    // FIX: smaller id first — matches DashboardPage roomId
    const u1 = Math.min(host_id, guest_id);
    const u2 = Math.max(host_id, guest_id);
    const room_id = `room_${u1}_${u2}`;

    const result = await pool.query(
      `INSERT INTO sessions (room_id, host_id, guest_id, skill_topic, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [room_id, host_id, guest_id, skill_topic || null]
    );
    res.status(201).json({ message: 'Session created!', session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE SESSION STATUS ────────────────────────────────────────────────────
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, duration_secs } = req.body;

    let query, params;
    if (status === 'active') {
      query  = `UPDATE sessions SET status='active', started_at=NOW() WHERE id=$1 RETURNING *`;
      params = [sessionId];
    } else if (status === 'completed') {
      query  = `UPDATE sessions SET status='completed', ended_at=NOW(), duration_secs=$2 WHERE id=$1 RETURNING *`;
      params = [sessionId, duration_secs || 0];
    } else {
      query  = `UPDATE sessions SET status=$2 WHERE id=$1 RETURNING *`;
      params = [sessionId, status];
    }

    const result = await pool.query(query, params);
    res.json({ message: 'Session updated!', session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET MY SESSIONS ──────────────────────────────────────────────────────────
exports.getMySessions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              h.username AS host_name,
              g.username AS guest_name
       FROM sessions s
       LEFT JOIN users h ON s.host_id  = h.id
       LEFT JOIN users g ON s.guest_id = g.id
       WHERE s.host_id = $1 OR s.guest_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};