import 'dotenv/config';
import { testConnection } from '../config/db.js';
import { Event } from '../models/index.js';

/**
 * Script pour ajouter une image par défaut à tous les événements sans image
 */

async function ensureConnected() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Impossible de se connecter à la base de données.');
    process.exit(1);
  }
}

async function addDefaultImages() {
  console.log('🖼️  Ajout d\'images par défaut aux événements...');

  // Liste des images par défaut
  const defaultImages = [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80&crop=entropy&cs=tinysrgb',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80&crop=entropy&cs=tinysrgb',
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&q=80&crop=entropy&cs=tinysrgb',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80&crop=entropy&cs=tinysrgb',
    'https://images.unsplash.com/photo-1478359866661-f1d4c0ec63d7?w=600&q=80&crop=entropy&cs=tinysrgb',
  ];

  // Récupérer tous les événements sans image
  const eventsWithoutImage = await Event.findAll({
    where: { image_url: null },
  });

  if (eventsWithoutImage.length === 0) {
    console.log('   ✅ Tous les événements ont une image.');
    return;
  }

  console.log(`   Mise à jour de ${eventsWithoutImage.length} événements...`);

  // Ajouter une image aléatoire à chaque événement
  for (let i = 0; i < eventsWithoutImage.length; i++) {
    const event = eventsWithoutImage[i];
    const imageUrl = defaultImages[i % defaultImages.length];
    
    await event.update({ image_url: imageUrl });
    console.log(`   ✅ ${event.title} - Image ajoutée`);
  }

  console.log(`\n🎉 ${eventsWithoutImage.length} événement(s) mis à jour !`);
}

async function main() {
  try {
    await ensureConnected();
    await addDefaultImages();
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images :', error);
    process.exit(1);
  }
}

main();
