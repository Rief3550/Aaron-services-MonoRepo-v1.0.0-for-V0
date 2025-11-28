import axios from 'axios';

const API_URL = 'http://localhost:3100'; // API Gateway exposed on port 3100
const ADMIN_EMAIL = 'admin@aaron.com';
const ADMIN_PASSWORD = 'admin123'; // Default seed password

async function verifyAdminFeatures() {
  try {
    console.log('1. Authenticating as Admin...');
    const authResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const token = authResponse.data.tokens.accessToken;
    console.log('✅ Admin authenticated');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Testing Admin Users CRUD...');
    // List Users
    const usersRes = await axios.get(`${API_URL}/admin/users`, { headers });
    console.log(`✅ Listed ${usersRes.data.length} users`);

    // Create User (Operator)
    const newOperator = {
      email: `operator_${Date.now()}@test.com`,
      password: 'password123',
      fullName: 'Test Operator',
      role: 'OPERATOR',
      phone: '1234567890',
      zone: 'Norte',
    };
    const createRes = await axios.post(`${API_URL}/admin/users`, newOperator, { headers });
    console.log(`✅ Created operator: ${createRes.data.email}`);
    const operatorId = createRes.data.id;

    // Toggle Status
    await axios.patch(`${API_URL}/admin/users/${operatorId}/status`, { active: false }, { headers });
    console.log('✅ Deactivated operator');

    console.log('\n3. Testing Admin Crews CRUD...');
    // Create Crew
    const newCrew = {
      name: `Crew ${Date.now()}`,
      zona: 'Norte',
      availability: 'AVAILABLE',
      members: [operatorId],
    };
    const crewRes = await axios.post(`${API_URL}/admin/crews`, newCrew, { headers });
    console.log(`✅ Created crew: ${crewRes.data.name}`);
    const crewId = crewRes.data.id;

    console.log('\n4. Testing Admin Work Types CRUD...');
    // Create Work Type
    const newWorkType = {
      nombre: `WorkType ${Date.now()}`,
      costoBase: 1000,
      unidad: 'visita',
    };
    const wtRes = await axios.post(`${API_URL}/admin/work-types`, newWorkType, { headers });
    console.log(`✅ Created work type: ${wtRes.data.nombre}`);
    const wtId = wtRes.data.id;

    console.log('\n5. Testing Admin Plans CRUD...');
    // Create Plan
    const newPlan = {
      name: `Plan ${Date.now()}`,
      price: 5000,
      workTypeIds: [wtId],
    };
    const planRes = await axios.post(`${API_URL}/admin/plans`, newPlan, { headers });
    console.log(`✅ Created plan: ${planRes.data.name}`);
    const planId = planRes.data.id;

    console.log('\n6. Testing Admin Subscriptions CRUD...');
    // Create Subscription
    const newSub = {
      userId: operatorId, // Using operator as client for test
      planId: planId,
      status: 'ACTIVE',
    };
    const subRes = await axios.post(`${API_URL}/admin/subscriptions`, newSub, { headers });
    console.log(`✅ Created subscription: ${subRes.data.id}`);
    const subId = subRes.data.id;

    // Change Status
    await axios.patch(`${API_URL}/admin/subscriptions/${subId}/estado`, { status: 'PAUSED' }, { headers });
    console.log('✅ Paused subscription');

    console.log('\n7. Testing Admin Metrics...');
    const metricsRes = await axios.get(`${API_URL}/metrics/admin/resumen`, { headers });
    console.log('✅ Fetched admin metrics summary');

    console.log('\n🎉 All Admin verifications passed!');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

verifyAdminFeatures();
