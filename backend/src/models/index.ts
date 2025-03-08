import User from './User';
import Account from './Account';
import Transaction from './Transaction';
import Asset from './Asset';
import Budget from './Budget';
import { sequelize } from '../config/database';

// Define model associations
User.hasMany(Account, {
  foreignKey: 'userId',
  as: 'accounts',
});
Account.belongsTo(User, {
  foreignKey: 'userId',
});

User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions',
});
Transaction.belongsTo(User, {
  foreignKey: 'userId',
});

Account.hasMany(Transaction, {
  foreignKey: 'accountId',
  as: 'transactions',
});
Transaction.belongsTo(Account, {
  foreignKey: 'accountId',
});

User.hasMany(Asset, {
  foreignKey: 'userId',
  as: 'assets',
});
Asset.belongsTo(User, {
  foreignKey: 'userId',
});

User.hasMany(Budget, {
  foreignKey: 'userId',
  as: 'budgets',
});
Budget.belongsTo(User, {
  foreignKey: 'userId',
});

// Export models and Sequelize instance
export {
  sequelize,
  User,
  Account,
  Transaction,
  Asset,
  Budget,
};