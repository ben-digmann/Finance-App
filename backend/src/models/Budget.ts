import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Budget extends Model {
  public id!: number;
  public userId!: number;
  public category!: string;
  public amount!: number;
  public period!: string;
  public startDate!: Date;
  public endDate!: Date | null;
  public rollover!: boolean;
  public isActive!: boolean;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Budget.init(
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
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Budget category (e.g., Housing, Food, Transportation)',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Budget amount for the specified period',
    },
    period: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Budget period (e.g., monthly, weekly, annual)',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Optional end date for the budget',
    },
    rollover: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether unused budget amounts roll over to next period',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    indexes: [
      {
        name: 'budget_user_index',
        fields: ['userId'],
      },
      {
        name: 'budget_category_index',
        fields: ['category'],
      },
    ],
  }
);

export default Budget;