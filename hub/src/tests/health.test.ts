import request from 'supertest';
import { createApp } from '../app';
import { closeDb } from '../db';

const app = createApp();

afterAll(() => closeDb());

describe('GET /health', () => {
  it('returns ok with hub metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.hubName).toBe('ClassBridge Local Hub');
    expect(res.body.version).toBeDefined();
    expect(res.body.time).toBeDefined();
  });
});
