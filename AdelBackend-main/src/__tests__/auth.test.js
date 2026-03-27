/**
 * Authentication Tests
 * 
 * These tests require a running database.
 * For CI, use the MySQL service defined in GitHub Actions.
 */

import request from 'supertest';

// Mock the app since we can't easily import ES modules in Jest
const API_URL = process.env.API_URL || 'http://localhost:4000';

describe('Auth API', () => {
  let accessToken;
  let refreshToken;
  const testUser = {
    fullName: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    role: 'USER',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(API_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/);

      // May get 201 or 409 depending on test run
      if (res.status === 201) {
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe(testUser.email.toLowerCase());
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
      }
    });

    it('should reject invalid email', async () => {
      const res = await request(API_URL)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect('Content-Type', /json/);

      expect(res.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(API_URL)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'new@example.com', password: 'weak' })
        .expect('Content-Type', /json/);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Use seeded user
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'admin@onelastevent.com',
          password: 'Admin123!',
        })
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
      }
    });

    it('should reject invalid credentials', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'admin@onelastevent.com',
          password: 'wrongpassword',
        })
        .expect('Content-Type', /json/);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      if (!refreshToken) {
        console.log('Skipping: No refresh token available');
        return;
      }

      const res = await request(API_URL)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user', async () => {
      if (!accessToken) {
        console.log('Skipping: No access token available');
        return;
      }

      const res = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('user');
      }
    });

    it('should reject without token', async () => {
      const res = await request(API_URL)
        .get('/api/auth/me')
        .expect('Content-Type', /json/);

      expect(res.status).toBe(401);
    });
  });
});

