import db from '../src/config/db.js';

async function main() {
  try {
    const [indexes] = await db.query(
      "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'"
    );

    const toDrop = indexes
      .map((i) => i.INDEX_NAME)
      .filter((name) => name.startsWith('email'))
      .filter((name) => name !== 'users_email');

    if (toDrop.length === 0) {
      console.log('No duplicate email indexes found to drop.');
      return;
    }

    console.log('Dropping indexes:', toDrop);
    for (const indexName of toDrop) {
      try {
        await db.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        console.log(`Dropped index: ${indexName}`);
      } catch (err) {
        console.warn(`Failed to drop ${indexName}: ${err.message}`);
      }
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error while dropping indexes:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
