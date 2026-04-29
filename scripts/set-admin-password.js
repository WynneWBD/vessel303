// Set or reset a backend user's password.
// Usage:
//   ADMIN_EMAIL=wynnewbd@gmail.com ADMIN_PASSWORD='StrongPass123' node scripts/set-admin-password.js
//   node scripts/set-admin-password.js wynnewbd@gmail.com 'StrongPass123'
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')

function readEnvConnectionString() {
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL
  try {
    const env = fs.readFileSync('.env.local', 'utf8')
    return env.match(/POSTGRES_URL=(.+)/)?.[1]?.trim()
  } catch {
    return undefined
  }
}

const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || process.argv[3] || ''
const connStr = readEnvConnectionString()

if (!connStr) {
  console.error('Missing POSTGRES_URL. Set it in env or .env.local.')
  process.exit(1)
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Missing or invalid admin email.')
  process.exit(1)
}

if (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  console.error('Password must be at least 12 characters and include letters and numbers.')
  process.exit(1)
}

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

async function main() {
  const hashed = await bcrypt.hash(password, 12)
  const res = await pool.query(
    `UPDATE users
     SET password = $2,
         role = CASE WHEN role IN ('admin', 'operator') THEN role ELSE 'admin' END,
         disabled = false
     WHERE lower(email) = $1
     RETURNING id, email, role`,
    [email, hashed],
  )

  if (!res.rows[0]) {
    console.error(`No user found for ${email}. Log in with Google once or create the user first.`)
    process.exitCode = 1
    return
  }

  console.log(`Password updated for ${res.rows[0].email} (${res.rows[0].role}).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
