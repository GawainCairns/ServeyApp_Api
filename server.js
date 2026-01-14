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
const serveyRouter = require('./routes/servey');
app.use('/servey', serveyRouter);

const pool = require('./db/utils/pool');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'ServeyApp API running' });
});

app.get('/health', (req, res) => res.sendStatus(200));

app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function shutdown() {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
