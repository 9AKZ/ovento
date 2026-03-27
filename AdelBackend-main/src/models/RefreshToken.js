import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class RefreshToken extends Model {
  /**
   * Check if token is expired
   */
  isExpired() {
    return new Date() > this.expires_at;
  }

  /**
   * Check if token is valid (not revoked and not expired)
   */
  isValid() {
    return !this.revoked && !this.isExpired();
  }
}

RefreshToken.init(
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
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'] },
      { fields: ['revoked'] },
      { fields: ['expires_at'] },
    ],
  },
);

export default RefreshToken;

