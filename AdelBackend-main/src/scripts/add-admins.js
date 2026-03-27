import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash.util.js';
import { testConnection } from '../config/db.js';
import { User } from '../models/index.js';

/**
 * Script pour ajouter les comptes admin spécifiques
 */

async function ensureConnected() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Impossible de se connecter à la base de données.');
    process.exit(1);
  }
}

async function addSpecificAdmins() {
  console.log('👤 Création des comptes admin spécifiques...');

  const adminPassword = await hashPassword('MotDePasse123!');

  // Admin Jury Test
  const [juryAdmin] = await User.findOrCreate({
    where: { email: 'jury_test_admin@test.com' },
    defaults: {
      id: uuidv4(),
      password_hash: adminPassword,
      full_name: 'Jury Test Admin',
      role: 'ADMIN',
      is_verified: true,
      bio: 'Compte admin pour les tests du jury.',
    },
  });
  console.log(`   ✅ Admin Jury créé/présent : ${juryAdmin.email}`);

  // Admin Adel Mekki
  const [adelAdmin] = await User.findOrCreate({
    where: { email: 'adel_mekki_admin@test.com' },
    defaults: {
      id: uuidv4(),
      password_hash: adminPassword,
      full_name: 'Adel Mekki Admin',
      role: 'ADMIN',
      is_verified: true,
      bio: 'Compte admin pour Adel Mekki.',
    },
  });
  console.log(`   ✅ Admin Adel créé/présent : ${adelAdmin.email}`);
}

async function main() {
  try {
    await ensureConnected();
    await addSpecificAdmins();
    console.log('🎉 Comptes admin ajoutés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des comptes admin :', error);
    process.exit(1);
  }
}

main();