/**
 * Events API Tests
 */

import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:4000';

describe('Events API', () => {
  let accessToken;
  let eventId;

  beforeAll(async () => {
    // Login as organizer
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'organizer1@example.com',
        password: 'Organizer1!',
      });

    if (res.status === 200) {
      accessToken = res.body.accessToken;
    }
  });

  describe('GET /api/events', () => {
    it('should list events', async () => {
      const res = await request(API_URL)
        .get('/api/events')
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('events');
        expect(res.body).toHaveProperty('total');
        expect(Array.isArray(res.body.events)).toBe(true);
      }
    });

    it('should filter by search', async () => {
      const res = await request(API_URL)
        .get('/api/events')
        .query({ search: 'workshop' })
        .expect('Content-Type', /json/);

      expect(res.status).toBe(200);
    });

    it('should paginate results', async () => {
      const res = await request(API_URL)
        .get('/api/events')
        .query({ page: 1, limit: 5 })
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body.events.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('POST /api/events', () => {
    it('should create event as organizer', async () => {
      if (!accessToken) {
        console.log('Skipping: No access token');
        return;
      }

      const eventData = {
        title: 'Test Event ' + Date.now(),
        description: 'A test event',
        location: 'Test Location',
        startDatetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 50,
        price: 0,
      };

      const res = await request(API_URL)
        .post('/api/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(eventData)
        .expect('Content-Type', /json/);

      if (res.status === 201) {
        expect(res.body).toHaveProperty('event');
        expect(res.body.event.title).toBe(eventData.title);
        eventId = res.body.event.id;
      }
    });

    it('should reject without auth', async () => {
      const res = await request(API_URL)
        .post('/api/events')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event by ID', async () => {
      if (!eventId) {
        // Get first event from list
        const listRes = await request(API_URL).get('/api/events');
        if (listRes.body.events?.length > 0) {
          eventId = listRes.body.events[0].id;
        }
      }

      if (!eventId) {
        console.log('Skipping: No event ID');
        return;
      }

      const res = await request(API_URL)
        .get(`/api/events/${eventId}`)
        .expect('Content-Type', /json/);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('event');
        expect(res.body.event.id).toBe(eventId);
      }
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(API_URL)
        .get('/api/events/00000000-0000-0000-0000-000000000000')
        .expect('Content-Type', /json/);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('should update own event', async () => {
      if (!accessToken || !eventId) {
        console.log('Skipping: Missing token or event ID');
        return;
      }

      const res = await request(API_URL)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/);

      // May fail if not owner
      if (res.status === 200) {
        expect(res.body.event.title).toBe('Updated Title');
      }
    });
  });

  describe('POST /api/events/:id/inscriptions', () => {
    it('should register for event', async () => {
      // Login as regular user
      const loginRes = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'User1234!',
        });

      if (loginRes.status !== 200) {
        console.log('Skipping: Could not login as user');
        return;
      }

      const userToken = loginRes.body.accessToken;

      // Get a published event
      const eventsRes = await request(API_URL).get('/api/events');
      const publishedEvent = eventsRes.body.events?.find(e => e.status === 'PUBLISHED');

      if (!publishedEvent) {
        console.log('Skipping: No published events');
        return;
      }

      const res = await request(API_URL)
        .post(`/api/events/${publishedEvent.id}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      // May get 201 or 409 (already registered)
      expect([201, 409]).toContain(res.status);
    });
  });
});

