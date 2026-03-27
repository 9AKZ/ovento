import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Inscription extends Model {
  /**
   * Check if inscription is confirmed
   */
  isConfirmed() {
    return this.status === 'CONFIRMED';
  }

  /**
   * Check if inscription can be cancelled
   */
  canBeCancelled() {
    return this.status !== 'CANCELLED';
  }

  /**
   * Convert to public JSON
   */
  toPublicJSON() {
    return {
      id: this.id,
      eventId: this.event_id,
      userId: this.user_id,
      status: this.status,
      createdAt: this.created_at,
    };
  }
}

Inscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Inscription',
    tableName: 'inscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['event_id', 'user_id'], unique: true },
    ],
  },
);

export default Inscription;

