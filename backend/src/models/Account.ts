import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Account extends Model {
  public id!: number;
  public userId!: number;
  public plaidAccountId!: string;
  public plaidItemId!: string;
  public accessToken!: string;
  public name!: string;
  public officialName!: string | null;
  public type!: string;
  public subtype!: string | null;
  public mask!: string | null;
  public currentBalance!: number;
  public availableBalance!: number | null;
  public isoCurrencyCode!: string;
  public lastUpdated!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
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
    plaidAccountId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    plaidItemId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    officialName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mask: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    availableBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    isoCurrencyCode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    indexes: [
      {
        name: 'account_user_index',
        fields: ['userId'],
      },
      {
        name: 'account_plaid_item_index',
        fields: ['plaidItemId'],
      },
    ],
  }
);

export default Account;