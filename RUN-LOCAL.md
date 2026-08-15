Local development instructions

To run the site locally (Windows PowerShell):

1) Install Node.js 18+ if you don't have it: https://nodejs.org/

2) Clone the repo and install dependencies:
   git clone https://github.com/AyazCute1655/Sunucuk.git
   cd Sunucuk
   npm install

3) Create a .env file in the repo root (use .env.example as template) and fill these values:
   - GITHUB_API_TOKEN (your GitHub PAT with repo/issues scope)
   - ADMIN_PASSWORD (q1w2e3r4 by default)
   - JWT_SECRET (random long string)

4) Start the server:
   node server.js

5) Open in browser:
   http://localhost:3000

Notes:
- The local server exposes the same API endpoints the frontend expects under /.netlify/functions/* so no frontend changes are necessary.
- If you don't want to create issues on your real repo while testing, omit GITHUB_API_TOKEN in .env (then create_issue will return a server-config error and fallback will copy the submission to clipboard).
