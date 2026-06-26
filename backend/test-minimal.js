/**
 * Minimal test server to isolate the problem
 */

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/test', (req, res) => {
  console.log('[Test] Received request');
  res.json({ message: 'It works!' });
});

app.listen(3001, () => {
  console.log('Minimal test server on http://localhost:3001');
  console.log('Test with: curl -X POST http://localhost:3001/test -H "Content-Type: application/json" -d "{\\"test\\":\\"data\\"}"');
});
