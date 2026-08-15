exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = event.body ? JSON.parse(event.body) : {};
    const mcname = (body.mcname || '').trim();
    const reason = (body.reason || '').trim();
    const experience = (body.experience || '').trim();

    if (!mcname || !reason) return { statusCode: 400, body: JSON.stringify({ error: 'mcname and reason required' }) };

    const title = `Whitelist Başvurusu: ${mcname}`;
    const issueBody = `**Kullanıcı adı:** ${mcname}\n\n**Neden:** ${reason}\n\n**Deneyim:** ${experience}\n\n*Gönderim IP: ${event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown'}*`;

    const token = process.env.GITHUB_API_TOKEN;
    if (!token) return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured (missing GITHUB_API_TOKEN)' }) };

    const res = await fetch('https://api.github.com/repos/AyazCute1655/Sunucuk/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body: issueBody, labels: ['whitelist'] })
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('GitHub create issue error', res.status, json);
      return { statusCode: res.status || 500, body: JSON.stringify({ error: json.message || 'GitHub error' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: json.html_url, number: json.number }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
