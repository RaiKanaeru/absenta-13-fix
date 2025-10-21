/*
  Integration test: Multi-Teacher flow (Opsi A)
  - Login as admin to obtain token
  - Fetch minimal kelas/mapel/guru data
  - Create schedule with multiple teachers (POST /api/admin/jadwal)
  - Verify schedule appears with multiple teachers via admin schedules endpoint
*/

const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

describe('Multi-Teacher Integration (Opsi A)', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin (use defaults from dataset)
    const login = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    adminToken = login?.data?.token;
    if (!adminToken) throw new Error('Admin token not obtained');
  }, 20000);

  test('Create schedule with multiple teachers and verify listing shows all teachers', async () => {
    // 1) Fetch base data needed: kelas, mapel, guru list
    const headers = { Authorization: `Bearer ${adminToken}` };

    const kelasResp = await api('/api/admin/kelas', { headers });
    const mapelResp = await api('/api/admin/mapel', { headers });
    const guruResp = await api('/api/admin/guru', { headers });

    const kelas = Array.isArray(kelasResp.data) ? kelasResp.data[0] : null;
    const mapel = Array.isArray(mapelResp.data) ? mapelResp.data[0] : null;
    const guruList = Array.isArray(guruResp.data) ? guruResp.data.filter(g => g.status === 'aktif') : [];

    expect(kelas).toBeTruthy();
    expect(mapel).toBeTruthy();
    expect(guruList.length).toBeGreaterThanOrEqual(2);

    const [g1, g2] = guruList;

    // 2) Create schedule with 2 teachers (guru_ids)
    const createPayload = {
      kelas_id: kelas.id_kelas,
      mapel_id: mapel.id_mapel,
      guru_id: g1.id_guru,                // primary (backward compat)
      guru_ids: [g1.id_guru, g2.id_guru], // all assigned
      is_multi_guru: true,
      hari: 'Senin',
      jam_ke: 1,
      jam_mulai: '07:00:00',
      jam_selesai: '07:45:00'
    };
    const createRes = await api('/api/admin/jadwal', {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload)
    });

    expect(createRes).toHaveProperty('id');
    const jadwalId = createRes.id;
    expect(jadwalId).toBeGreaterThan(0);

    // 3) Fetch admin schedules and verify both teachers are present
    const schedulesResp = await api('/api/admin/jadwal', { headers });
    expect(Array.isArray(schedulesResp.data)).toBe(true);

    const created = schedulesResp.data.find(s => s.id === jadwalId || s.id_jadwal === jadwalId);
    expect(created).toBeTruthy();

    // admin listing aggregates guru via jadwal_guru (GROUP_CONCAT)
    // created.guru_ids may be a comma string; normalize to array of ints
    const idsConcat = created.guru_ids || created.semua_guru_ids;
    expect(idsConcat).toBeTruthy();
    const idArray = String(idsConcat).split(',').map(v => parseInt(v));
    expect(idArray).toEqual(expect.arrayContaining([g1.id_guru, g2.id_guru]));
  }, 30000);
});




