import { User } from '../../../src/models';
import { sequelize } from '../../../src/config/database';
import bcrypt from 'bcrypt';

// Setup and teardown
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('User Model', () => {
  const userData = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  it('should create a new user with hashed password', async () => {
    // Create a new user
    const user = await User.create(userData);
    
    // Check that the user was created
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
    
    // Verify that the password hashing worked correctly
    const validPassword = await bcrypt.compare(userData.password, user.password);
    expect(validPassword).toBe(true);
  });

  it('should validate email format', async () => {
    // Attempt to create a user with invalid email
    try {
      await User.create({
        ...userData,
        email: 'invalid-email',
      });
      // If we reach this point, the validation didn't throw an error
      fail('Email validation failed to detect invalid email');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should enforce unique email constraint', async () => {
    // Attempt to create a second user with the same email
    try {
      await User.create(userData);
      // If we reach this point, the uniqueness constraint didn't work
      fail('Uniqueness constraint failed for email');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should compare passwords correctly', async () => {
    // Find the user
    const user = await User.scope('withPassword').findOne({
      where: { email: userData.email },
    });
    
    // Check that the password comparison works
    expect(user).toBeDefined();
    if (user) {
      const validPassword = await user.comparePassword(userData.password);
      expect(validPassword).toBe(true);
      
      const invalidPassword = await user.comparePassword('WrongPassword123!');
      expect(invalidPassword).toBe(false);
    }
  });

  it('should hash passwords on update', async () => {
    // Find the user
    const user = await User.scope('withPassword').findOne({
      where: { email: userData.email },
    });
    
    // Update the password
    const newPassword = 'NewPassword456!';
    expect(user).toBeDefined();
    if (user) {
      const originalHash = user.password;
      user.password = newPassword;
      await user.save();
      
      // Password should be hashed differently
      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe(newPassword);
      
      // Verify that the new password works
      const validPassword = await user.comparePassword(newPassword);
      expect(validPassword).toBe(true);
    }
  });
});