const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', require('./routes/index'));
app.get('/', (req, res) => res.json({ message: 'SkillSwap API running!' }));

// userId → socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {

  // ── Register user ──────────────────────────────────────────────────────
  socket.on('register', async (userId) => {
    onlineUsers.set(String(userId), socket.id);
    console.log(`✅ Registered user ${userId} → socket ${socket.id}`);

    // Offline-ல இருந்தப்போ வந்த pending requests deliver பண்ணு
    try {
      const pool = require('./config/db');
      const pending = await pool.query(
        `SELECT m.*, u.username, u.skills_offered, u.skills_needed
         FROM matches m
         JOIN users u ON u.id = m.user_id
         WHERE m.matched_id = $1
         AND m.status = 'pending'`,
        [parseInt(userId)]
      );
      pending.rows.forEach(req => {
        const u1 = Math.min(req.user_id, req.matched_id);
        const u2 = Math.max(req.user_id, req.matched_id);
        socket.emit('incoming-request', {
          fromUser: {
            id:             req.user_id,
            username:       req.username,
            skills_offered: req.skills_offered,
            skills_needed:  req.skills_needed
          },
          roomId: `room_${u1}_${u2}`
        });
        console.log(`📨 Pending request delivered to user ${userId} from user ${req.user_id}`);
      });
    } catch(e) {
      console.log('Pending check error:', e.message);
    }
  });

  // ── Skill exchange request ─────────────────────────────────────────────
  socket.on('send-request', ({ fromUser, toUserId, roomId }) => {
    const toSocket = onlineUsers.get(String(toUserId));
    const pool = require('./config/db');

    // Online-ஆ offline-ஆ எப்படி இருந்தாலும் DB-ல save பண்ணு ✅
    pool.query(
      `INSERT INTO matches (user_id, matched_id, match_score, status)
       VALUES ($1,$2,1,'pending')
       ON CONFLICT (user_id, matched_id) DO UPDATE SET status='pending'`,
      [String(fromUser.id), String(toUserId)]
    ).then(() => console.log(`💾 Match saved: ${fromUser.id} → ${toUserId}`))
     .catch(e => console.log('Match save error:', e.message));

    if (toSocket) {
      // Online → உடனே popup
      io.to(toSocket).emit('incoming-request', { fromUser, roomId });
      console.log(`📨 Request: ${fromUser.username} → user ${toUserId} | room: ${roomId}`);
    } else {
      // Offline → toast காட்டு (online வந்தப்போ deliver ஆகும்)
      socket.emit('request-failed', { message: 'User is currently offline' });
      console.log(`💾 Offline — request saved to DB for user ${toUserId}`);
    }
  });

  // ── Accept request ─────────────────────────────────────────────────────
  socket.on('accept-request', ({ fromUserId, toUser, roomId }) => {
    const fromSocket = onlineUsers.get(String(fromUserId));
    if (fromSocket) {
      io.to(fromSocket).emit('request-accepted', { fromUser: toUser, roomId });
      console.log(`✅ Accepted — room: ${roomId}`);
    }
    const pool = require('./config/db');
    const u1 = String(fromUserId), u2 = String(toUser.id);
    pool.query(
      `UPDATE matches SET status='accepted'
       WHERE (user_id=$1 AND matched_id=$2) OR (user_id=$2 AND matched_id=$1)`,
      [u1, u2]
    ).catch(()=>{});
    pool.query(
      `INSERT INTO matches (user_id, matched_id, match_score, status)
       VALUES ($1,$2,1,'accepted') ON CONFLICT DO NOTHING`,
      [u1, u2]
    ).catch(()=>{});
  });

  // ── Reject request ─────────────────────────────────────────────────────
  socket.on('reject-request', ({ fromUserId, toUser }) => {
    const fromSocket = onlineUsers.get(String(fromUserId));
    if (fromSocket) io.to(fromSocket).emit('request-rejected', { byUser: toUser });
  });

  // ── WebRTC room ────────────────────────────────────────────────────────
  socket.on('join-room', (roomId) => {
    const roomBefore = io.sockets.adapter.rooms.get(roomId);
    const sizeBefore = roomBefore ? roomBefore.size : 0;

    socket.join(roomId);
    console.log(`🚪 join-room: ${socket.id} | room: ${roomId} | was: ${sizeBefore}`);

    if (sizeBefore === 0) {
      socket.emit('joined-as-first');
      console.log(`⏳ First in room ${roomId}`);
    } else {
      socket.to(roomId).emit('peer-joined');
      socket.emit('joined-as-second');
      console.log(`🚀 BOTH in room ${roomId} — WebRTC starting!`);
    }
  });

  // ── WebRTC signaling ───────────────────────────────────────────────────
  socket.on('offer',     ({ roomId, offer })     => { socket.to(roomId).emit('offer',     offer);     console.log(`📡 offer → ${roomId}`); });
  socket.on('answer',    ({ roomId, answer })    => { socket.to(roomId).emit('answer',    answer);    console.log(`📡 answer → ${roomId}`); });
  socket.on('candidate', ({ roomId, candidate }) => { socket.to(roomId).emit('candidate', candidate); });

  // ── Chat ───────────────────────────────────────────────────────────────
  socket.on('send-message', async (data) => {
    socket.to(data.roomId).emit('receive-message', data);
    try {
      const pool = require('./config/db');
      // FIX: exact match + like match both try பண்ணு
      const sess = await pool.query(
        `SELECT id FROM sessions
         WHERE room_id = $1
         OR room_id LIKE $2
         ORDER BY created_at DESC LIMIT 1`,
        [data.roomId, `%${data.roomId}%`]
      );
      const sessionId = sess.rows[0]?.id || null;
      const senderId  = data.userId || null;
      if (sessionId && senderId) {
        await pool.query(
          'INSERT INTO messages (session_id, sender_id, message) VALUES ($1, $2, $3)',
          [sessionId, senderId, data.text]
        );
        console.log(`💬 Message saved — session ${sessionId}`);
      } else {
        console.log(`💬 Message not saved — sessionId: ${sessionId}, senderId: ${senderId}`);
      }
    } catch(e) { console.log('msg save error:', e.message); }
  });

  // ── End call ───────────────────────────────────────────────────────────
  socket.on('end-call', ({ roomId, fromUser, toUser }) => {
    // Peer-க்கு மட்டும் show-review emit பண்ணு
    // Host-க்கு VideoCallPage endCall() itself setShowReview(true) பண்றது
    socket.to(roomId).emit('show-review', { peer: fromUser });
    console.log(`📋 Review triggered for room ${roomId}`);
  });

  // ── Leave room ─────────────────────────────────────────────────────────
  socket.on('leave-room', (roomId) => {
    socket.to(roomId).emit('peer-left');
    socket.leave(roomId);
    console.log(`👋 ${socket.id} left room ${roomId}`);
  });

  // ── Disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        console.log(`❌ User ${uid} offline`);
        socket.broadcast.emit('user-left', uid);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SkillSwap running on http://localhost:${PORT}\n`);
});
