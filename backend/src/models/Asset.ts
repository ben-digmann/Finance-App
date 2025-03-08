import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Asset extends Model {
  public id!: number;
  public userId!: number;
  public name!: string;
  public type!: string;
  public value!: number;
  public purchaseDate!: Date | null;
  public purchasePrice!: number | null;
  public lastValuationDate!: Date;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Asset type (e.g., real estate, vehicle, jewelry, art, other)',
    },
    value: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      comment: 'Current estimated value of the asset',
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    lastValuationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets',
    indexes: [
      {
        name: 'asset_user_index',
        fields: ['userId'],
      },
    ],
  }
);

export default Asset;