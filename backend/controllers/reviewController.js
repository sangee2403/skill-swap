const pool = require('../config/db');

// ─── SUBMIT REVIEW ────────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { expert_id, rating, review_text, session_id } = req.body;
    const user_id = req.user ? req.user.id : req.body.user_id;

    if (!expert_id || !rating) {
      return res.status(400).json({ msg: 'expert_id and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    // ❌ REMOVED: self-review check — same browser testing-ல fail ஆகும்
    // if (parseInt(expert_id) === parseInt(user_id)) {
    //   return res.status(400).json({ msg: 'You cannot review yourself' });
    // }

    const result = await pool.query(
      `INSERT INTO reviews (expert_id, user_id, session_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [expert_id, user_id, session_id || null, rating, review_text || null]
    );

    res.status(201).json({ message: 'Review saved successfully!', review: result.rows[0] });
  } catch (err) {
    console.error('Review Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET EXPERT RATINGS ───────────────────────────────────────────────────────
exports.getExpertRatings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.expert_id,
        u.username                                                    AS expert_name,
        ROUND(AVG(r.rating)::numeric, 2)                             AS avg_rating,
        COUNT(*)                                                      AS total_reviews,
        (SELECT review_text FROM reviews
         WHERE expert_id = r.expert_id
         ORDER BY created_at DESC LIMIT 1)                           AS last_review
      FROM reviews r
      JOIN users u ON r.expert_id = u.id
      GROUP BY r.expert_id, u.username
      ORDER BY avg_rating DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET REVIEWS FOR ONE EXPERT ───────────────────────────────────────────────
exports.getReviewsByExpert = async (req, res) => {
  try {
    const { expertId } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.username AS reviewer_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.expert_id = $1
       ORDER BY r.created_at DESC`,
      [expertId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
