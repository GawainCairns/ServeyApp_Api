const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Enable CORS for any origin (allow all).
app.use(cors());
// If you want to restrict CORS to only your local dev server (localhost:5500),
// replace the line above with:
// app.use(cors({ origin: 'http://localhost:5500' }));

app.use(bodyParser.json());

// DB routes
const dbRouter = require('./routes/db');
app.use('/db', dbRouter);

// Auth routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// Survey routes
const surveyRoutes = require('./routes/survey');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/survey', surveyRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
// Response routes
const responseRoutes = require('./routes/response');
app.use('/response', responseRoutes);

const pool = require('./db/utils/pool');
const { generateUnique } = require('./db/utils/s_code');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'SurveyApp API running' });
});

app.get('/health', (req, res) => res.sendStatus(200));

app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

let server;

async function ensureSurveysHaveCodes() {
  try {
    const [rows] = await pool.execute('SELECT id FROM surveys WHERE s_code IS NULL OR s_code = ""');
    for (const r of rows) {
      try {
        const code = await generateUnique(pool);
        await pool.execute('UPDATE surveys SET s_code = ? WHERE id = ?', [code, r.id]);
        console.log('Assigned s_code to survey', r.id, code);
      } catch (err) {
        console.error('failed to assign s_code for survey', r.id, err.message || err);
      }
    }
  } catch (err) {
    console.error('error ensuring surveys have s_code', err.message || err);
  }
}

async function startServer() {
  await ensureSurveysHaveCodes();
  server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

function shutdown() {
  console.log('Shutting down server...');
  if (server) server.close(() => process.exit(0)); else process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer().catch(err => {
  console.error('failed to start server', err);
  process.exit(1);
});

module.exports = app;
