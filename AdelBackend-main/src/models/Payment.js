import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Payment extends Model {
  /**
   * Check if payment is completed
   */
  isCompleted() {
    return this.status === 'PAID';
  }

  /**
   * Check if payment can be refunded
   */
  canBeRefunded() {
    return this.status === 'PAID';
  }

  /**
   * Convert to public JSON
   */
  toPublicJSON() {
    return {
      id: this.id,
      userId: this.user_id,
      eventId: this.event_id,
      amount: this.amount,
      currency: this.currency,
      provider: this.provider,
      status: this.status,
      createdAt: this.created_at,
    };
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    inscription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'inscriptions',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'stripe',
    },
    provider_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['event_id'] },
      { fields: ['inscription_id'] },
      { fields: ['status'] },
      { fields: ['provider_payment_id'] },
    ],
  },
);

export default Payment;

