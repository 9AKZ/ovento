import sequelize from '../config/db.js';
import User from './User.js';
import Event from './Event.js';
import Inscription from './Inscription.js';
import Payment from './Payment.js';
import RefreshToken from './RefreshToken.js';

// Define associations

// User - Event (One-to-Many: User can organize many events)
User.hasMany(Event, {
  foreignKey: 'organizer_id',
  as: 'organizedEvents',
});
Event.belongsTo(User, {
  foreignKey: 'organizer_id',
  as: 'organizer',
});

// User - Inscription (One-to-Many: User can have many inscriptions)
User.hasMany(Inscription, {
  foreignKey: 'user_id',
  as: 'inscriptions',
});
Inscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Event - Inscription (One-to-Many: Event can have many inscriptions)
Event.hasMany(Inscription, {
  foreignKey: 'event_id',
  as: 'inscriptions',
});
Inscription.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

// User - Payment (One-to-Many: User can have many payments)
User.hasMany(Payment, {
  foreignKey: 'user_id',
  as: 'payments',
});
Payment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Event - Payment (One-to-Many: Event can have many payments)
Event.hasMany(Payment, {
  foreignKey: 'event_id',
  as: 'payments',
});
Payment.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

// Inscription - Payment (One-to-One: Inscription can have one payment)
Inscription.hasOne(Payment, {
  foreignKey: 'inscription_id',
  as: 'payment',
});
Payment.belongsTo(Inscription, {
  foreignKey: 'inscription_id',
  as: 'inscription',
});

// User - RefreshToken (One-to-Many: User can have many refresh tokens)
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Many-to-Many: User participates in Events through Inscriptions
User.belongsToMany(Event, {
  through: Inscription,
  foreignKey: 'user_id',
  otherKey: 'event_id',
  as: 'participatingEvents',
});
Event.belongsToMany(User, {
  through: Inscription,
  foreignKey: 'event_id',
  otherKey: 'user_id',
  as: 'participants',
});

export {
  sequelize,
  User,
  Event,
  Inscription,
  Payment,
  RefreshToken,
};

export default {
  sequelize,
  User,
  Event,
  Inscription,
  Payment,
  RefreshToken,
};
