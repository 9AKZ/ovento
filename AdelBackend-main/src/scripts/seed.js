import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash.util.js';
import { testConnection } from '../config/db.js';
import { User, Event, Inscription, Payment } from '../models/index.js';

// Quick diagnostic for DB credentials (dotenv loaded via import 'dotenv/config' at top)
const dbPassPresent = !!process.env.DB_PASS;
console.log(`🔐 DB credentials: user=${process.env.DB_USER || 'root'}, DB_PASS set=${dbPassPresent}`);

if (!dbPassPresent) {
  console.error('❌ DB_PASS is not set. Please create a .env file in project root or export DB_PASS in your environment. Example: DB_PASS=adel3010');
  process.exit(1);
}

/**
 * Script de Seed amélioré pour OneLastEvent
 * Options CLI :
 *   --only=admins,users,events  (choix des sections, séparées par des virgules)
 *   --users=5                   (nombre d'utilisateurs à créer)
 *   --events=8                  (nombre d'événements à créer)
 *   --preserve                  (ne pas détruire les données existantes)
 *   --force                     (autorise l'exécution en production)
 * Exemples :
 *   node src/scripts/seed.js --only=admins,users --users=3
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [key, value] = arg.slice(2).split('=');
    out[key] = value === undefined ? true : value;
  });
  return out;
}

async function ensureConnected() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Impossible de se connecter à la base de données.');
    process.exit(1);
  }
}

async function seedAdminsAndUsers({ usersCount = 5 } = {}) {
  console.log('👤 Création des utilisateurs (admins / organizers / users)...');

  const adminPassword = await hashPassword('Admin123!');
  const userPassword = await hashPassword('User1234!');
  const organizerPassword = await hashPassword('Organizer1!');

  // Admin (findOrCreate for idempotence)
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@onelastevent.com' },
    defaults: {
      id: uuidv4(),
      password_hash: adminPassword,
      full_name: 'Adel Administrateur',
      role: 'ADMIN',
      is_verified: true,
      bio: 'Administrateur principal de la plateforme OneLastEvent.',
    },
  });
  console.log(`   ✅ Admin présent : ${admin.email}`);

  // Organisateurs
  const [organizer1] = await User.findOrCreate({
    where: { email: 'organisateur1@exemple.com' },
    defaults: {
      id: uuidv4(),
      password_hash: organizerPassword,
      full_name: 'Marie Dupont',
      role: 'ORGANIZER',
      is_verified: true,
      bio: 'Organisatrice spécialisée dans les conférences tech et ateliers.',
    },
  });
  console.log(`   ✅ Organisateur 1 présent : ${organizer1.email}`);

  const [organizer2] = await User.findOrCreate({
    where: { email: 'organisateur2@exemple.com' },
    defaults: {
      id: uuidv4(),
      password_hash: organizerPassword,
      full_name: 'Jean Martin',
      role: 'ORGANIZER',
      is_verified: true,
      bio: 'Expert en événements culturels et dégustations.',
    },
  });
  console.log(`   ✅ Organisateur 2 présent : ${organizer2.email}`);

  const users = [];
  for (let i = 1; i <= usersCount; i++) {
    const email = `utilisateur${i}@exemple.com`;
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        id: uuidv4(),
        password_hash: userPassword,
        full_name: `Utilisateur ${i}`,
        role: 'USER',
        is_verified: true,
        bio: `Utilisateur régulier de la plateforme numéro ${i}`,
      },
    });
    users.push(user);
  }
  console.log(`   ✅ ${usersCount} utilisateurs standards présents/créés.`);

  return { admin, organizer1, organizer2, users };
}

const EVENT_TEMPLATES = (organizers) => ([
  {
    title: 'Introduction au Développement Web',
    description: "Un atelier gratuit pour débutants afin d'apprendre les bases du HTML, CSS et JavaScript.",
    location: 'Paris, France - En ligne',
    deltaStartDays: 7,
    durationHours: 3,
    capacity: 100,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['tech', 'atelier', 'gratuit', 'débutant'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
  },
  {
    title: 'Masterclass Patterns React Avancés',
    description: 'Plongez dans les patterns React complexes : composants composés, render props et hooks personnalisés.',
    location: 'Lyon, France',
    deltaStartDays: 14,
    durationHours: 8,
    capacity: 30,
    price: 149.99,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['react', 'javascript', 'atelier', 'avancé'],
    organizerId: organizers[0].id,
  },
  {
    title: 'Festival de Musique Été 2026',
    description: 'Trois jours de musique live avec des artistes locaux et internationaux. Food trucks et art !',
    location: 'Bordeaux, France',
    deltaStartDays: 30,
    durationDays: 3,
    capacity: 5000,
    price: 89.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['musique', 'festival', 'été'],
    organizerId: organizers[1].id,
  },
  {
    title: 'Soirée Networking Startups',
    description: 'Rencontrez des entrepreneurs, investisseurs et passionnés de tech.',
    location: 'Paris, France',
    deltaStartDays: 5,
    durationHours: 4,
    capacity: 150,
    price: 25.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['networking', 'startup', 'business'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
  },
  {
    title: 'Dégustation de Vins et Fromages',
    description: 'Découvrez les crus français avec notre sommelier. Dégustation de 8 vins.',
    location: 'Toulouse, France',
    deltaStartDays: 10,
    durationHours: 3,
    capacity: 25,
    price: 75.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['vin', 'dégustation', 'culture'],
    organizerId: organizers[1].id,
  },
  {
    title: 'Masterclass Backend Node.js',
    description: 'Apprenez à construire des applications backend scalables avec Node.js, Express et Sequelize.',
    location: 'En ligne',
    deltaStartDays: 21,
    durationHours: 6,
    capacity: 50,
    price: 199.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['nodejs', 'backend', 'programmation'],
    organizerId: organizers[0].id,
  },
  {
    title: 'Atelier IA & Machine Learning - Bientôt disponible',
    description: 'Les fondamentaux du Machine Learning avec Python.',
    location: 'À définir',
    deltaStartDays: 60,
    capacity: 40,
    price: 299.0,
    currency: 'EUR',
    status: 'DRAFT',
    tags: ['ia', 'python'],
    organizerId: organizers[0].id,
  },
  {
    title: 'Yoga Communautaire au Parc',
    description: 'Séance gratuite en plein air pour tous les niveaux. Apportez votre tapis !',
    location: "Parc de la Tête d'Or, Lyon",
    deltaStartDays: 3,
    durationHours: 1.5,
    capacity: 50,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['yoga', 'gratuit', 'bien-être'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=300&fit=crop',
  },
]);

async function seedEvents({ organizers = [], eventsCount = 8 } = {}) {
  console.log('\n📅 Création des événements...');
  const templates = EVENT_TEMPLATES(organizers);
  const events = [];

  for (let i = 0; i < Math.min(eventsCount, templates.length); i++) {
    const t = templates[i];
    const start = new Date(Date.now() + t.deltaStartDays * 24 * 60 * 60 * 1000);
    const end = t.durationDays
      ? new Date(start.getTime() + t.durationDays * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + (t.durationHours || 2) * 60 * 60 * 1000);

    const [event] = await Event.findOrCreate({
      where: { title: t.title },
      defaults: {
        id: uuidv4(),
        organizer_id: t.organizerId,
        title: t.title,
        description: t.description,
        location: t.location,
        start_datetime: start,
        end_datetime: end,
        capacity: t.capacity,
        price: t.price,
        currency: t.currency,
        status: t.status,
        tags: t.tags,
        image_url: t.image_url,
      },
    });
    events.push(event);
    console.log(`   ✅ Événement présent/créé : ${event.title}`);
  }

  return events;
}

async function seedInscriptionsAndPayments({ users = [], events = [] } = {}) {
  console.log('\n📝 Création des inscriptions et paiements...');

  // Simple logique d'exemples : inscrire les premiers utilisateurs aux premiers événements
  if (users.length === 0 || events.length === 0) {
    console.log('   ⚠️ Pas assez d\'utilisateurs ou d\'événements pour créer des inscriptions.');
    return;
  }

  // Inscrire 3 utilisateurs au premier événement
  const event1 = events[0];
  for (let i = 0; i < Math.min(3, users.length); i++) {
    await Inscription.findOrCreate({
      where: { event_id: event1.id, user_id: users[i].id },
      defaults: {
        id: uuidv4(),
        event_id: event1.id,
        user_id: users[i].id,
        status: 'CONFIRMED',
      },
    });
    await event1.increment('current_participants');
    console.log(`   ✅ Inscription pour ${users[i].email} à ${event1.title}`);
  }

  // Paiement mock pour le deuxième événement (si existant)
  if (events[1]) {
    const paidUser = users[0];
    const event2 = events[1];
    const [ins] = await Inscription.findOrCreate({
      where: { event_id: event2.id, user_id: paidUser.id },
      defaults: {
        id: uuidv4(),
        event_id: event2.id,
        user_id: paidUser.id,
        status: 'CONFIRMED',
      },
    });

    await Payment.findOrCreate({
      where: { inscription_id: ins.id },
      defaults: {
        id: uuidv4(),
        user_id: paidUser.id,
        event_id: event2.id,
        inscription_id: ins.id,
        amount: event2.price || 0,
        currency: event2.currency || 'EUR',
        provider: 'mock',
        provider_payment_id: `pay_${Date.now()}`,
        status: 'PAID',
      },
    });
    console.log(`   ✅ Paiement mock créé pour ${paidUser.email} (${event2.title})`);
  }
}

async function main() {
  const args = parseArgs();
  const only = args.only ? args.only.split(',') : ['all'];
  const usersCount = parseInt(args.users || '5', 10);
  const eventsCount = parseInt(args.events || '8', 10);
  const preserve = !!args.preserve || !!args['no-clean'];
  const force = !!args.force;

  if (process.env.NODE_ENV === 'production' && !force) {
    console.error('⚠️ Seed aborted: running in production without --force');
    process.exit(1);
  }

  await ensureConnected();

  // Cleanup unless preserve
  if (!preserve) {
    console.log('🗑️ Nettoyage des anciennes données...');
    await Payment.destroy({ where: {} });
    await Inscription.destroy({ where: {} });
    await Event.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('✅ Base de données prête pour les nouvelles données.\n');
  } else {
    console.log('🔒 Préservation des données existantes (mode preserve).');
  }

  const results = {};

  if (only.includes('all') || only.includes('admins') || only.includes('users')) {
    const usersRes = await seedAdminsAndUsers({ usersCount });
    results.usersRes = usersRes;
  }

  if (only.includes('all') || only.includes('events')) {
    const organizers = results.usersRes ? [results.usersRes.organizer1, results.usersRes.organizer2] : await User.findAll({ where: { role: 'ORGANIZER' }, limit: 2 });
    const events = await seedEvents({ organizers, eventsCount });
    results.events = events;
  }

  if (only.includes('all') || only.includes('inscriptions') || only.includes('payments')) {
    const usersList = results.usersRes ? results.usersRes.users : await User.findAll({ where: { role: 'USER' } });
    const eventsList = results.events || await Event.findAll({});
    await seedInscriptionsAndPayments({ users: usersList, events: eventsList });
  }

  console.log('\n✨ Seeding terminé avec succès !');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Échec du seeding :', err.message || err);
  process.exit(1);
});