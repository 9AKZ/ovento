import sequelize from '../src/config/db.js';

(async () => {
  try {
    const [rows] = await sequelize.query(
      `SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME LIKE 'email_%'`,
    );

    const toDrop = rows.map((r) => r.INDEX_NAME).filter(Boolean);
    console.log('Indexes found:', toDrop);

    for (const idx of toDrop) {
      console.log('Dropping', idx);
      await sequelize.query(`ALTER TABLE users DROP INDEX \`${idx}\``);
    }

    console.log('Done');
  } catch (e) {
    console.error('Error dropping indexes:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
