import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Event extends Model {
  /**
   * Check if event is free
   */
  isFree() {
    return parseFloat(this.price) === 0;
  }

  /**
   * Check if event has capacity available
   */
  hasCapacity() {
    return this.current_participants < this.capacity;
  }

  /**
   * Check if event is published
   */
  isPublished() {
    return this.status === 'PUBLISHED';
  }

  /**
   * Get remaining spots
   */
  getRemainingSpots() {
    return Math.max(0, this.capacity - this.current_participants);
  }

  /**
   * Convert to public JSON
   */
  toPublicJSON() {
    const daysUntilStart = Math.ceil((new Date(this.start_datetime) - Date.now()) / 86400000);

    const isMonday = new Date().getDay() === 1;
    const originalPrice = parseFloat(this.price);
    const discountedPrice =
      isMonday && daysUntilStart >= 0 && daysUntilStart < 3 && originalPrice > 0
        ? parseFloat((originalPrice * 0.75).toFixed(2))
        : undefined;

    return {
      id: this.id,
      title: this.title,
      description: this.description ?? undefined,
      location: this.location,
      startDatetime: this.start_datetime,
      endDatetime: this.end_datetime ?? undefined,
      capacity: this.capacity,
      currentParticipants: this.current_participants,
      remainingSpots: this.getRemainingSpots(),
      price: this.price,
      currency: this.currency,
      status: this.status,
      imageUrl: this.image_url ?? undefined,
      organizerId: this.organizer_id,
      tags: Array.isArray(this.tags) ? this.tags : [],
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      daysUntilStart,
      discountedPrice,
    };
  }
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    start_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
      },
    },
    current_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CANCELLED'),
      defaultValue: 'DRAFT',
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['organizer_id'] },
      { fields: ['status'] },
      { fields: ['start_datetime'] },
      { fields: ['price'] },
      { fields: ['location'] },
    ],
  },
);

export default Event;