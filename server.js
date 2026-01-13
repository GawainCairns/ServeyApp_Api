const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// DB routes
const dbRouter = require('./routes/db');
app.use('/db', dbRouter);

// Auth routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

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
