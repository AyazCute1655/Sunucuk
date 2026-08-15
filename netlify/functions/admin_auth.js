const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = event.body ? JSON.parse(event.body) : {};
    const password = (body.password || '');
    const expected = process.env.ADMIN_PASSWORD || '';
    if (!expected) return { statusCode: 500, body: 'Server not configured' };

    if (password !== expected) {
      return { statusCode: 401, body: JSON.stringify({ authenticated: false, message: 'Invalid password' }) };
    }

    // create JWT
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const iat = Math.floor(Date.now()/1000);
    const exp = iat + (60*60*24); // 24h
    const payload = base64url(JSON.stringify({ sub: 'admin', iat, exp }));
    const toSign = `${header}.${payload}`;
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev_secret').update(toSign).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const token = `${toSign}.${sig}`;

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `admin_jwt=${token}; HttpOnly; Path=/; Secure; SameSite=Lax; Max-Age=${60*60*24}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ authenticated: true })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};
