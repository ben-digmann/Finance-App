import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Transaction extends Model {
  public id!: number;
  public userId!: number;
  public accountId!: number;
  public plaidTransactionId!: string;
  public category!: string;
  public subcategory!: string | null;
  public llmCategory!: string | null;
  public userCategory!: string | null;
  public name!: string;
  public merchantName!: string | null;
  public amount!: number;
  public date!: Date;
  public pending!: boolean;
  public paymentChannel!: string;
  public address!: string | null;
  public city!: string | null;
  public country!: string | null;
  public postalCode!: string | null;
  public region!: string | null;
  public isoCurrencyCode!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to get the effective category
  public getEffectiveCategory(): string {
    // User-set category takes precedence, then LLM category, then Plaid category
    return this.userCategory || this.llmCategory || this.category || 'Uncategorized';
  }
}

Transaction.init(
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
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    plaidTransactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Original Plaid category',
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Original Plaid subcategory',
    },
    llmCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category assigned by LLM',
    },
    userCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category manually assigned by user',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    merchantName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    paymentChannel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isoCurrencyCode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD',
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    indexes: [
      {
        name: 'transaction_user_index',
        fields: ['userId'],
      },
      {
        name: 'transaction_account_index',
        fields: ['accountId'],
      },
      {
        name: 'transaction_date_index',
        fields: ['date'],
      },
      {
        name: 'transaction_category_index',
        fields: ['category'],
      },
      {
        name: 'transaction_llm_category_index',
        fields: ['llmCategory'],
      },
      {
        name: 'transaction_user_category_index',
        fields: ['userCategory'],
      },
    ],
  }
);

export default Transaction;