const express = require('express');
const router = express.Router();
const pool = require('../db/utils/pool');

// GET /user/admin/info - return all admins' id, name and email
router.get('/admin/info', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE role = ?', ['admin']);
    res.json(rows);
  } catch (err) {
    console.error('get admins info error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id/servey - get all surveys where creator matches user id
router.get('/:id/servey', async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM serveys WHERE creator = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('get user serveys error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id - get a user's name
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT id, name FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get user error', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;