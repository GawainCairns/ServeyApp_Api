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

// Questions endpoints
// POST /servey/:id/question
router.post('/:id/question', async (req, res) => {
  const { id } = req.params;
  const { question, type } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question required' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (servey_id, question, type) VALUES (?, ?, ?)',
      [id, question, type || 'text']
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /servey/:id/question/:qid
router.put('/:id/question/:qid', async (req, res) => {
  const { id, qid } = req.params;
  const { question, type } = req.body || {};
  if (question === undefined && type === undefined) return res.status(400).json({ error: 'nothing to update' });

  const fields = [];
  const values = [];
  if (question !== undefined) { fields.push('question = ?'); values.push(question); }
  if (type !== undefined) { fields.push('type = ?'); values.push(type); }

  values.push(qid, id);
  const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ? AND servey_id = ?`;

  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error('update question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /servey/:id/question
router.get('/:id/question', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE servey_id = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('list questions error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /servey/:id/question/:qid
router.get('/:id/question/:qid', async (req, res) => {
  const { id, qid } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ? AND servey_id = ?', [qid, id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Answers endpoints
// POST /servey/:id/answer
router.post('/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { question_id, answer } = req.body || {};
  if (!question_id || answer === undefined) return res.status(400).json({ error: 'question_id and answer required' });

  try {
    // verify question belongs to servey
    const [qrows] = await pool.execute('SELECT id FROM questions WHERE id = ? AND servey_id = ?', [question_id, id]);
    if (!qrows.length) return res.status(400).json({ error: 'question not found for this servey' });

    const [result] = await pool.execute('INSERT INTO answers (question_id, answer) VALUES (?, ?)', [question_id, answer]);
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create answer error', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /servey/:id/answer/:aid
router.put('/:id/answer/:aid', async (req, res) => {
  const { id, aid } = req.params;
  const { question_id, answer } = req.body || {};
  if (question_id === undefined && answer === undefined) return res.status(400).json({ error: 'nothing to update' });

  try {
    const fields = [];
    const values = [];
    if (question_id !== undefined) {
      // verify question belongs to servey
      const [qrows] = await pool.execute('SELECT id FROM questions WHERE id = ? AND servey_id = ?', [question_id, id]);
      if (!qrows.length) return res.status(400).json({ error: 'question not found for this servey' });
      fields.push('question_id = ?'); values.push(question_id);
    }
    if (answer !== undefined) { fields.push('answer = ?'); values.push(answer); }

    values.push(aid);
    const sql = `UPDATE answers SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error('update answer error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /servey/:id/answer
router.get('/:id/answer', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT a.* FROM answers a JOIN questions q ON a.question_id = q.id WHERE q.servey_id = ?',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('list answers error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /servey/:id/answer/:aid
router.get('/:id/answer/:aid', async (req, res) => {
  const { id, aid } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT a.* FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = ? AND q.servey_id = ?',
      [aid, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get answer error', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
