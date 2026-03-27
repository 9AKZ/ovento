import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

// Load .env explicitly from project root so that config is consistent whatever the CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });
console.log(`🔍 dotenv loaded from: ${result.parsed ? envPath : 'none'}`);

// Diagnostic log (safety: we never log the password itself)
console.log(`🔍 DB DEBUG: user=${process.env.DB_USER || 'root'}, DB_PASS set=${!!process.env.DB_PASS}`);

const dbPassword = process.env.DB_PASS || '';
if (process.env.NODE_ENV === 'production' && !dbPassword) {
  console.error('Missing DB_PASS in production environment. Exiting.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'onelastevent', 
  process.env.DB_USER || 'root',
  dbPassword, // pulled from process.env.DB_PASS
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

/**
 * Sync all models with database
 */
export async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
}

export default sequelize;