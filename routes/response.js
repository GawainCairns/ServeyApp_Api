const express = require('express');
const router = express.Router();

const pool = require('../db/utils/pool');

// POST http://localhost:3000/response/:id  -> create a response for survey :id
router.post('/:id', async (req, res) => {
  const { id } = req.params; // survey id
  const { question_id, answer, responder_id } = req.body || {};
  if (!question_id || answer === undefined || !responder_id) {
    return res.status(400).json({ error: 'question_id, answer and responder_id required' });
  }

  try {
    // verify question belongs to survey
    const [qrows] = await pool.execute('SELECT id FROM questions WHERE id = ? AND survey_id = ?', [question_id, id]);
    if (!qrows.length) return res.status(400).json({ error: 'question not found for this survey' });

    const [result] = await pool.execute(
      'INSERT INTO responses (survey_id, question_id, answer, responder_id) VALUES (?, ?, ?, ?)',
      [id, question_id, answer, responder_id]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('create response error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET http://localhost:3000/response/survey/:id -> get all responses for a survey
router.get('/survey/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM responses WHERE survey_id = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('list responses by survey error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET http://localhost:3000/response/survey/:surveyId/:responderId -> get responses by survey and responder
router.get('/survey/:surveyId/:responderId', async (req, res) => {
  const { surveyId, responderId } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM responses WHERE survey_id = ? AND responder_id = ?', [surveyId, responderId]);
    return res.json(rows);
  } catch (err) {
    console.error('list responses by survey+responder error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET http://localhost:3000/response/question/:id -> get all responses for a question
router.get('/question/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM responses WHERE question_id = ?', [id]);
    return res.json(rows);
  } catch (err) {
    console.error('list responses by question error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET http://localhost:3000/response/r_id -> get last used responder_id (0 if none)
router.get('/r_id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT responder_id FROM responses ORDER BY id DESC LIMIT 1');
    const lastResponder = rows.length ? rows[0].responder_id : 0;
    return res.json({ last_responder_id: lastResponder });
  } catch (err) {
    console.error('get last responder id error', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
