import 'dotenv/config';
import { testConnection } from '../config/db.js';
import { User } from '../models/index.js';

/**
 * Script pour lister les comptes admin
 */

async function ensureConnected() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Impossible de se connecter à la base de données.');
    process.exit(1);
  }
}

async function listAdmins() {
  console.log('👤 Comptes admin existants :');

  const admins = await User.findAll({
    where: { role: 'ADMIN' },
    attributes: ['id', 'email', 'full_name', 'role', 'is_verified', 'created_at'],
  });

  if (admins.length === 0) {
    console.log('   Aucun compte admin trouvé.');
  } else {
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} - ${admin.full_name} (vérifié: ${admin.is_verified})`);
    });
  }
}

async function main() {
  try {
    await ensureConnected();
    await listAdmins();
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des comptes admin :', error);
    process.exit(1);
  }
}

main();