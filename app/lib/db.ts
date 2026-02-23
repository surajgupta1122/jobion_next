import mysql from 'mysql2/promise';

declare global {
  var mysqlPool: mysql.Pool | undefined;
}

const pool = global.mysqlPool ?? mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

if (process.env.NODE_ENV === 'development') {
  global.mysqlPool = pool;
}

// ✅ Test connection and log in terminal
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully to database:', process.env.DB_NAME);
    console.log('📦 Host:', process.env.DB_HOST);
    console.log('👤 User:', process.env.DB_USER);
    connection.release();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ MySQL Connection Failed:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }
  }
})();

export default pool;
