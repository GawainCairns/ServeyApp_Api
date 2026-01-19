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

// GET /user/:id/survey - get all surveys where creator matches user id
router.get('/:id/survey', async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM surveys WHERE creator = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('get user surveys error', err);
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

// DELETE /user/:id/del - delete a user by id
router.delete('/:id/del', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ message: 'user deleted', id: Number(id) });
  } catch (err) {
    console.error('delete user error', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /user/:id/update - update allowed user fields (name, email, role)
router.put('/:id/update', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const fields = [];
  const values = [];

  if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
  if (typeof email !== 'undefined') { fields.push('email = ?'); values.push(email); }
  if (typeof role !== 'undefined') { fields.push('role = ?'); values.push(role); }

  if (!fields.length) return res.status(400).json({ error: 'no fields to update' });

  try {
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });

    const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('update user error', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;