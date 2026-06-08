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
    title: 'Soirée Jazz & Cocktails',
    description: "Une soirée intimiste dans une cave voûtée du Marais pour découvrir le jazz manouche dans son ambiance la plus authentique. Trois groupes se succèdent sur scène, le bar propose des cocktails maison et une sélection de vins naturels. L'occasion parfaite pour passer une belle soirée, que vous soyez amateur de jazz ou simplement curieux.",
    location: 'Le Marais, Paris',
    deltaStartDays: 4,
    durationHours: 4,
    capacity: 80,
    price: 18.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['musique', 'jazz', 'soirée', 'cocktails'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop',
  },
  {
    title: 'Randonnée Forêt de Fontainebleau',
    description: "Une balade guidée de 12 km à travers les rochers et les chênes centenaires de la forêt de Fontainebleau. Le guide naturaliste partage ses connaissances sur la faune et la flore locales tout au long du parcours. Départ en train depuis Paris-Lyon, pique-nique tiré du sac à mi-parcours. Niveau facile, ouvert à tous dès 10 ans.",
    location: 'Fontainebleau, Île-de-France',
    deltaStartDays: 6,
    durationHours: 6,
    capacity: 20,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['nature', 'randonnée', 'gratuit', 'famille'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop',
  },
  {
    title: 'Cours de Cuisine Italienne',
    description: "Apprenez à préparer un vrai repas italien de A à Z avec un chef originaire de Naples : pasta fraîche tiramisù et risotto aux champignons sauvages. Le cours se déroule dans une cuisine équipée en petits groupes de 8 personnes maximum. Vous repartez avec les recettes et vous dégustez ce que vous avez cuisiné autour d'un verre de vin.",
    location: 'Vieux-Port, Marseille',
    deltaStartDays: 9,
    durationHours: 3,
    capacity: 8,
    price: 55.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['cuisine', 'gastronomie', 'atelier', 'italie'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  },
  {
    title: 'Dégustation de Vins Nature',
    description: "Plongez dans l'univers fascinant des vins naturels avec notre sommelière certifiée. Au programme : 8 vins sélectionnés chez de petits vignerons, accompagnés d'un plateau de fromages affinés et de charcuteries artisanales. Vous apprendrez à décrypter les étiquettes, identifier les arômes et comprendre ce qui différencie un vin nature d'un vin conventionnel. Accessible à tous, même aux novices.",
    location: 'Toulouse, France',
    deltaStartDays: 12,
    durationHours: 3,
    capacity: 20,
    price: 45.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['vin', 'dégustation', 'gastronomie', 'fromage'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
  },
  {
    title: 'Festival Électro — Nuit Blanche',
    description: "12 heures de musique électronique non-stop dans un hangar industriel reconverti en salle de concert. Trois scènes accueillent des DJs locaux et des artistes venus de toute l'Europe : techno, house, ambient et drum & bass. Bar, food trucks et espace chill-out. Le festival s'engage pour la sécurité de tous ses participants avec une équipe de médiateurs présente toute la nuit.",
    location: 'Bordeaux, France',
    deltaStartDays: 18,
    durationHours: 12,
    capacity: 1200,
    price: 29.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['musique', 'électro', 'festival', 'nuit'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
  },
  {
    title: 'Atelier Photo Urbaine',
    description: "Partez explorer la ville autrement avec un photographe professionnel. Pendant 4 heures, vous apprenez à composer une image, jouer avec la lumière naturelle et capturer l'âme d'un quartier. L'atelier se termine par un retour en studio pour sélectionner et retoucher vos meilleures photos. Adapté aux débutants comme aux photographes confirmés. Apportez votre appareil photo ou smartphone.",
    location: 'Belleville, Paris',
    deltaStartDays: 14,
    durationHours: 4,
    capacity: 10,
    price: 39.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['photo', 'art', 'atelier', 'urbain'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop',
  },
  {
    title: 'Marché des Créateurs — Art & Design',
    description: "Chaque premier dimanche du mois, une cinquantaine de créateurs locaux investissent la cour de la Manufacture pour exposer et vendre leurs œuvres : céramique, illustrations, bijoux, textiles et mobilier design. Entrée libre, animations musicales toute la journée et restauration sur place. Un événement convivial pour soutenir l'artisanat local et découvrir de nouveaux talents.",
    location: 'Lille, France',
    deltaStartDays: 3,
    durationHours: 8,
    capacity: 500,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['art', 'marché', 'créateurs', 'gratuit'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  },
  {
    title: 'Yoga au Lever du Soleil',
    description: "Une séance de yoga douce pour bien commencer la semaine, en plein air face à la mer. Ouverte à tous les niveaux, elle mêle postures de hatha yoga, exercices de respiration et quelques minutes de méditation guidée. Apportez votre tapis et une couverture légère pour la relaxation finale. En cas de pluie, la séance se tient sous la grande halle du parc.",
    location: "Plage des Catalans, Marseille",
    deltaStartDays: 2,
    durationHours: 1.5,
    capacity: 30,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['yoga', 'sport', 'bien-être', 'gratuit'],
    organizerId: organizers[1].id,
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
  },
  {
    title: 'Escape Game Grandeur Nature',
    description: "Vivez une aventure immersive en équipe dans les couloirs d'un château du XVIIe siècle. Vous avez 90 minutes pour résoudre des énigmes, déjouer des pièges et percer le mystère de la disparition du comte de Monfort. Groupes de 4 à 8 personnes, accessible dès 12 ans. Idéal pour un anniversaire, un team-building ou simplement une sortie originale entre amis.",
    location: 'Château de Pierrefonds, Oise',
    deltaStartDays: 21,
    durationHours: 2,
    capacity: 40,
    price: 22.0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['jeu', 'aventure', 'famille', 'team-building'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&h=400&fit=crop',
  },
  {
    title: 'Conférence : Intelligence Artificielle & Société',
    description: "Trois intervenants — une chercheuse en IA, un philosophe de l'éthique numérique et une journaliste spécialisée — débattent des enjeux concrets de l'intelligence artificielle dans nos vies : emploi, santé, liberté d'expression et désinformation. Format TEDx suivi d'un temps d'échange avec le public. Entrée libre sur inscription, places limitées.",
    location: 'Cité des Sciences, Paris',
    deltaStartDays: 25,
    durationHours: 3,
    capacity: 200,
    price: 0,
    currency: 'EUR',
    status: 'PUBLISHED',
    tags: ['conférence', 'IA', 'société', 'gratuit'],
    organizerId: organizers[0].id,
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
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