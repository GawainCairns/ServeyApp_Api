const express = require('express');
const router = express.Router();
const pool = require('../db/utils/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware: require a valid Bearer JWT with role 'admin'
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const token = auth.slice(7).trim();
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT secret not configured' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
  if (payload.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  req.user = payload;
  next();
}

// Apply admin requirement to all routes in this router
router.use(requireAdmin);

// POST /admin/user - create a new user (hash password like /auth/register)
router.post('/user', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'user already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name || null, email, hashed, role || 'user']
    );

    const insertedId = result.insertId;
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [insertedId]);
    if (!rows.length) return res.status(500).json({ error: 'failed to retrieve created user' });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create user error', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/user/:id - update a user
router.put('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Build dynamic SET clause to avoid passing `undefined` as bind params
    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }

    if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' });

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('update user error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/user/:id - get a single user
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('get user error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/users - get all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error('get users error', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/user/:id - delete a user
router.delete('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    res.status(204).send();
  } catch (err) {
    console.error('delete user error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
