const { Pool } = require('pg');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';
console.log(`Current environment: ${env}`);

dotenv.config({ path: `.env.${env}` });


let pool;

if (env === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
}

module.exports = pool;
