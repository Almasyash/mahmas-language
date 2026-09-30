import request from 'supertest';
import { createApp } from '../src/app';

describe('Mahmas Language Backend Gateway', () => {
  const app = createApp();

  it('GET /api/v1/health should return UP status with metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.meta).toBeDefined();
  });

  it('GET /api/v1/info should return capabilities catalog', async () => {
    const res = await request(app).get('/api/v1/info');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.capabilities).toContain('AI_TUTOR');
    expect(res.body.data.capabilities).toContain('HUMAN_VIDEO_CALL');
  });
});
