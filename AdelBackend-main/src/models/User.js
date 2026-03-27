import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class User extends Model {
  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.role === 'ADMIN';
  }

  /**
   * Check if user is organizer
   */
  isOrganizer() {
    return this.role === 'ORGANIZER' || this.role === 'ADMIN';
  }

  /**
   * Get public profile (exclude sensitive data)
   */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.full_name,
      role: this.role,
      bio: this.bio,
      avatarUrl: this.avatar_url,
      isVerified: this.is_verified,
      createdAt: this.created_at,
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('USER', 'ORGANIZER', 'ADMIN'),
      defaultValue: 'USER',
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['role'] },
      { fields: ['is_verified'] },
    ],
  },
);

export default User;

