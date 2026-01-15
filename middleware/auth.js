const jwt = require('jsonwebtoken');
const pool = require('../db/utils/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || typeof auth !== 'string') return res.status(401).json({ error: 'missing authorization header' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid authorization header' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

async function requireCreatorOrAdminCreate(req, res, next) {
  const { creator } = req.body || {};
  if (!creator) return res.status(400).json({ error: 'creator required' });
  if (req.user && req.user.role === 'admin') return next();
  if (Number(req.user && req.user.id) === Number(creator)) return next();
  return res.status(403).json({ error: 'forbidden' });
}

async function requireCreatorOrAdminForServey(req, res, next) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const [rows] = await pool.execute('SELECT creator FROM serveys WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    const existingCreator = rows[0].creator;

    // admin can do anything
    if (req.user && req.user.role === 'admin') return next();

    // must be the existing creator
    if (Number(req.user && req.user.id) !== Number(existingCreator)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // if the update tries to change the creator field, ensure it stays the same user
    if (req.body && req.body.creator !== undefined) {
      if (Number(req.body.creator) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'cannot change creator' });
      }
    }

    return next();
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  requireAuth,
  requireCreatorOrAdminCreate,
  requireCreatorOrAdminForServey,
};
