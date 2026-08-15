const express = require('express');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static site (index.html and assets)
app.use(express.static(path.join(__dirname, '/')));

// Helper to require env
const GITHUB_TOKEN = process.env.GITHUB_API_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// POST /.netlify/functions/create_issue
app.post('/.netlify/functions/create_issue', async (req, res) => {
  try {
    const { mcname = '', reason = '', experience = '' } = req.body;
    if (!mcname.trim() || !reason.trim()) return res.status(400).json({ error: 'mcname and reason required' });
    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Server not configured (missing GITHUB_API_TOKEN)' });

    const title = `Whitelist Başvurusu: ${mcname}`;
    const body = `**Kullanıcı adı:** ${mcname}\n\n**Neden:** ${reason}\n\n**Deneyim:** ${experience}\n\n*Gönderim IP: ${req.ip}*`;

    const r = await fetch('https://api.github.com/repos/AyazCute1655/Sunucuk/issues', {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body, labels: ['whitelist'] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: j.message || 'GitHub error' });
    return res.json({ url: j.html_url, number: j.number });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /.netlify/functions/admin_auth
app.post('/.netlify/functions/admin_auth', (req, res) => {
  try {
    const { password = '' } = req.body;
    if (!ADMIN_PASSWORD) return res.status(500).send('Server not configured');
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ authenticated: false, message: 'Invalid password' });

    const payload = { sub: 'admin' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('admin_jwt', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ authenticated: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

// GET /.netlify/functions/me
app.get('/.netlify/functions/me', (req, res) => {
  try {
    const token = req.cookies.admin_jwt;
    if (!token) return res.status(401).json({ authenticated: false });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) return res.status(401).json({ authenticated: false });
    return res.json({ authenticated: true, user: decoded.sub || 'admin' });
  } catch (err) {
    return res.status(401).json({ authenticated: false });
  }
});

// GET /.netlify/functions/logout
app.get('/.netlify/functions/logout', (req, res) => {
  res.clearCookie('admin_jwt');
  return res.redirect('/');
});

// GET /.netlify/functions/fetch_issues
app.get('/.netlify/functions/fetch_issues', async (req, res) => {
  try {
    const r = await fetch('https://api.github.com/repos/AyazCute1655/Sunucuk/issues?labels=whitelist&state=open&per_page=100', {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (!r.ok) return res.status(r.status).send('GitHub API error');
    const j = await r.json();
    return res.json(j);
  } catch (err) {
    console.error(err);
    return res.status(500).send('error');
  }
});

app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
