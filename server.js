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

// Servey routes
const serveyRoutes = require('./routes/servey');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/servey', serveyRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
// Response routes
const responseRoutes = require('./routes/response');
app.use('/response', responseRoutes);

const pool = require('./db/utils/pool');
const { generateUnique } = require('./db/utils/s_code');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'ServeyApp API running' });
});

app.get('/health', (req, res) => res.sendStatus(200));

app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

let server;

async function ensureServeysHaveCodes() {
  try {
    const [rows] = await pool.execute('SELECT id FROM serveys WHERE s_code IS NULL OR s_code = ""');
    for (const r of rows) {
      try {
        const code = await generateUnique(pool);
        await pool.execute('UPDATE serveys SET s_code = ? WHERE id = ?', [code, r.id]);
        console.log('Assigned s_code to servey', r.id, code);
      } catch (err) {
        console.error('failed to assign s_code for servey', r.id, err.message || err);
      }
    }
  } catch (err) {
    console.error('error ensuring serveys have s_code', err.message || err);
  }
}

async function startServer() {
  await ensureServeysHaveCodes();
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
