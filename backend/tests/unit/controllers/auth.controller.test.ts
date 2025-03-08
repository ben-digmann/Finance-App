import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../src/server';
import { User } from '../../../src/models';
import { sequelize } from '../../../src/config/database';

// Setup and teardown
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Controller', () => {
  const userData = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check response
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      
      // Ensure password is not returned
      expect(response.body.user).not.toHaveProperty('password');
      
      // Check that token is returned
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should not register a user with an existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Check error message
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
          // Missing other required fields
        })
        .expect(400);

      // Check validation errors
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // Check response
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      
      // Check that token is returned
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      
      // Verify token content
      const decoded = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production'
      );
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', userData.email);
    });

    it('should not log in with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Check error message
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not log in non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      // Check error message
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});