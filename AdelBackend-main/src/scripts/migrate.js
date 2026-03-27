import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, syncDatabase } from '../config/db.js';
import sequelize from '../config/db.js';

// Import all models to register them
import '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Read SQL migration file
    const migrationsPath = path.join(__dirname, '../migrations/001_create_tables.sql');
    
    if (fs.existsSync(migrationsPath)) {
      console.log('📄 Found SQL migration file, executing...');
      const sql = fs.readFileSync(migrationsPath, 'utf8');
      
      // Split by semicolon and filter empty queries
      const queries = sql
        .split(';')
        .map((query) => query.trim())
        .filter((query) => query.length > 0 && !query.startsWith('--'));

      for (const query of queries) {
        try {
          console.log(`   Executing: ${query.substring(0, 50)}...`);
          await sequelize.query(query);
        } catch (err) {
          // Ignore "table already exists" errors
          if (!err.message.includes('already exists')) {
            console.warn(`   ⚠️  Warning: ${err.message}`);
          }
        }
      }
      console.log('✅ SQL migrations completed.\n');
    }

    // Sync Sequelize models (creates tables if not exist, alters if needed)
    console.log('🔄 Syncing Sequelize models...');
    await syncDatabase({ alter: true });
    console.log('✅ Sequelize models synced.\n');

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
