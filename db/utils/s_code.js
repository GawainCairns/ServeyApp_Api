const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomDigits(length) {
  let s = '';
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function randomChars(length) {
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
  return s;
}

function generateCode() {
  const part1 = ('0' + Math.floor(Math.random() * 100)).slice(-2); // 2 digits
  const part2 = randomChars(5);
  const part3 = ('00' + Math.floor(Math.random() * 1000)).slice(-3); // 3 digits
  return `${part1}${part2}${part3}`;
}

async function generateUnique(pool, attempts = 10000) {
  for (let i = 0; i < attempts; i++) {
    const code = generateCode();
    try {
      const [rows] = await pool.execute('SELECT id FROM serveys WHERE s_code = ?', [code]);
      if (!rows.length) return code;
    } catch (err) {
      // on DB error, continue attempts until exhausted
    }
  }
  throw new Error('unable to generate unique s_code');
}

function validateFormat(code) {
  if (!code || typeof code !== 'string') return false;
  return /^\d{2}[A-Za-z0-9]{5}\d{3}$/.test(code) && code.length >= 10;
}

module.exports = { generateCode, generateUnique, validateFormat };
