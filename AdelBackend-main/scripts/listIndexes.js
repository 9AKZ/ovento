import db from '../src/config/db.js';

async function main() {
  try {
    const [indexes] = await db.query(`SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'`);
    console.log('Indexes on users:', indexes.map((i) => i.INDEX_NAME));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
