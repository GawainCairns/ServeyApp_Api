const express = require('express');
const router = express.Router();

const pool = require('../db/utils/pool');
const { generateUnique, validateFormat } = require('../db/utils/s_code');
const { requireAuth, requireCreatorOrAdminCreate, requireCreatorOrAdminForSurvey } = require('../middleware/auth');

// Create a new survey
// POST /survey/create
router.post('/create', requireAuth, requireCreatorOrAdminCreate, async (req, res) => {
  const { name, discription, creator, s_code } = req.body || {};
  if (!name || !creator) return res.status(400).json({ error: 'name and creator required' });

  try {
    let codeToUse = s_code;
    if (codeToUse) {
      if (!validateFormat(codeToUse)) return res.status(400).json({ error: 'invalid s_code format' });
      // verify uniqueness
      const [exist] = await pool.execute('SELECT id FROM surveys WHERE s_code = ?', [codeToUse]);
      if (exist.length) return res.status(400).json({ error: 's_code already in use' });
    } else {
      codeToUse = await generateUnique(pool);
    }

    const [result] = await pool.execute(
      'INSERT INTO surveys (name, discription, creator, s_code) VALUES (?, ?, ?, ?)',
      [name, discription || null, creator, codeToUse]
    );
    return res.status(201).json({ id: result.insertId, s_code: codeToUse });
  } catch (err) {
    console.error('create survey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all surveys
// GET /survey
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM surveys');
    return res.json(rows);
  } catch (err) {
    console.error('list surveys error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get a survey by s_code
// GET /survey/code/:s_code
router.get('/code/:s_code', async (req, res) => {
  const { s_code } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM surveys WHERE s_code = ?', [s_code]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get survey by s_code error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all surveys for a user
// GET /user/:id/survey
router.get('/user/:id/survey', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM surveys WHERE creator = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('user surveys error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get a single survey by id
// GET /survey/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM surveys WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get survey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update a survey by id
// PUT /survey/:id
router.put('/:id', requireAuth, requireCreatorOrAdminForSurvey, async (req, res) => {
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
  const sql = `UPDATE surveys SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error('update survey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a survey by id
// DELETE /survey/:id
router.delete('/:id', requireAuth, requireCreatorOrAdminForSurvey, async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // remove responses tied to this survey
      await conn.execute('DELETE FROM responses WHERE survey_id = ?', [id]);
      // remove answers that belong to questions of this survey
      await conn.execute('DELETE a FROM answers a JOIN questions q ON a.question_id = q.id WHERE q.survey_id = ?', [id]);
      // remove questions for this survey
      await conn.execute('DELETE FROM questions WHERE survey_id = ?', [id]);
      // remove the survey
      const [result] = await conn.execute('DELETE FROM surveys WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'not found' });
      }
      await conn.commit();
      conn.release();
      return res.status(204).send();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err) {
    console.error('delete survey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Questions endpoints
// create a new question for a survey.
// POST /survey/:id/question
router.post('/:id/question', async (req, res) => {
  const { id } = req.params;
  const { question, type } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question required' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (survey_id, question, type) VALUES (?, ?, ?)',
      [id, question, type || 'text']
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update a question for a survey.
// PUT /survey/:id/question/:qid
router.put('/:id/question/:qid', async (req, res) => {
  const { id, qid } = req.params;
  const { question, type } = req.body || {};
  if (question === undefined && type === undefined) return res.status(400).json({ error: 'nothing to update' });

  const fields = [];
  const values = [];
  if (question !== undefined) { fields.push('question = ?'); values.push(question); }
  if (type !== undefined) { fields.push('type = ?'); values.push(type); }

  values.push(qid, id);
  const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ? AND survey_id = ?`;

  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error('update question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// get all questions for a survey.
// GET /survey/:id/question
router.get('/:id/question', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE survey_id = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('list questions error', err);
    return res.status(500).json({ error: err.message });
  }
});

// get a single question for a survey.
// GET /survey/:id/question/:qid
router.get('/:id/question/:qid', async (req, res) => {
  const { id, qid } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ? AND survey_id = ?', [qid, id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Answers endpoints
// create a new answer for a survey question.
// POST /survey/:id/answer
router.post('/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { question_id, answer } = req.body || {};
  if (!question_id || answer === undefined) return res.status(400).json({ error: 'question_id and answer required' });

  try {
    // verify question belongs to survey
    const [qrows] = await pool.execute('SELECT id FROM questions WHERE id = ? AND survey_id = ?', [question_id, id]);
    if (!qrows.length) return res.status(400).json({ error: 'question not found for this survey' });

    const [result] = await pool.execute('INSERT INTO answers (question_id, answer) VALUES (?, ?)', [question_id, answer]);
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create answer error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update an answer for a survey question.
// PUT /survey/:id/answer/:aid
router.put('/:id/answer/:aid', async (req, res) => {
  const { id, aid } = req.params;
  const { question_id, answer } = req.body || {};
  if (question_id === undefined && answer === undefined) return res.status(400).json({ error: 'nothing to update' });

  try {
    const fields = [];
    const values = [];
    if (question_id !== undefined) {
      // verify question belongs to survey
      const [qrows] = await pool.execute('SELECT id FROM questions WHERE id = ? AND survey_id = ?', [question_id, id]);
      if (!qrows.length) return res.status(400).json({ error: 'question not found for this survey' });
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

// get all answers for a survey.
// GET /survey/:id/answer
router.get('/:id/answer', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT a.* FROM answers a JOIN questions q ON a.question_id = q.id WHERE q.survey_id = ?',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('list answers error', err);
    return res.status(500).json({ error: err.message });
  }
});

// get a single answer for a survey.
// GET /survey/:id/answer/:aid
router.get('/:id/answer/:aid', async (req, res) => {
  const { id, aid } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT a.* FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = ? AND q.survey_id = ?',
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
