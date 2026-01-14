const express = require('express');
const router = express.Router();

const pool = require('../db/utils/pool');

// Create a new servey
// POST /servey/create
router.post('/create', async (req, res) => {
  const { name, discription, creator } = req.body || {};
  if (!name || !creator) return res.status(400).json({ error: 'name and creator required' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO serveys (name, discription, creator) VALUES (?, ?, ?)',
      [name, discription || null, creator]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create servey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all serveys
// GET /servey
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM serveys');
    return res.json(rows);
  } catch (err) {
    console.error('list serveys error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all serveys for a user
// GET /user/:id/servey
router.get('/user/:id/servey', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM serveys WHERE creator = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('user serveys error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get a single servey by id
// GET /servey/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM serveys WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get servey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update a servey by id
// PUT /servey/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, discription, creator } = req.body || {};
  if (name === undefined && discription === undefined && creator === undefined) {
    return res.status(400).json({ error: 'nothing to update' });
  }

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (discription !== undefined) { fields.push('discription = ?'); values.push(discription); }
  if (creator !== undefined) { fields.push('creator = ?'); values.push(creator); }

  values.push(id);
  const sql = `UPDATE serveys SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error('update servey error', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
