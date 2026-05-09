const express    = require('express');
const router     = express.Router();
const authMW     = require('../middleware/auth');

const authCtrl    = require('../controllers/authController');
const userCtrl    = require('../controllers/userController');
const reviewCtrl  = require('../controllers/reviewController');
const sessionCtrl = require('../controllers/sessionController');

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH  (Public routes - no token needed)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/register     → Register new user
router.post('/register', authCtrl.registerUser);

// POST /api/login        → Login user, get JWT token
router.post('/login',    authCtrl.loginUser);

// ─────────────────────────────────────────────────────────────────────────────
//  USER  (Protected routes - token required)
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/profile             → Get logged-in user's profile
router.get('/profile', authMW, userCtrl.getProfile);

// PUT  /api/update-profile      → Update skills, wallet, bio
router.put('/update-profile', authMW, userCtrl.updateProfile);

// GET  /api/matches/:userId     → Get skill matches for a user
router.get('/matches/:userId', userCtrl.findMatches);

// GET  /api/users               → Get all users (browse)
router.get('/users', userCtrl.getAllUsers);

// ─────────────────────────────────────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/expert-ratings          → All experts with avg rating
router.get('/expert-ratings', reviewCtrl.getExpertRatings);

// GET  /api/reviews/:expertId       → Reviews for a specific expert
router.get('/reviews/:expertId', reviewCtrl.getReviewsByExpert);

// POST /api/submit-review           → Submit a review (protected)
router.post('/submit-review', authMW, reviewCtrl.submitReview);

// ─────────────────────────────────────────────────────────────────────────────
//  SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/sessions                → Create a new session
router.post('/sessions', authMW, sessionCtrl.createSession);

// PUT  /api/sessions/:sessionId     → Update session status
router.put('/sessions/:sessionId', authMW, sessionCtrl.updateSession);

// GET  /api/sessions                → Get my sessions history
router.get('/sessions', authMW, sessionCtrl.getMySessions);

// SKILL CREDENTIALS
router.get('/skill-credentials/:userId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query(
      'SELECT * FROM skill_credentials WHERE user_id=$1 ORDER BY issued_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/skill-credentials', authMW, async (req, res) => {
  try {
    const pool = require('../config/db');
    const { skill_name, tx_hash, contract_address } = req.body;
    const result = await pool.query(
      `INSERT INTO skill_credentials (user_id, skill_name, issued_by, tx_hash, contract_address, is_verified)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [req.user.id, skill_name, req.user.id, tx_hash||null, contract_address||null]
    );
    res.status(201).json(result.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
