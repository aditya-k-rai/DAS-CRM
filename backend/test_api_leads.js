const jwt = require('jsonwebtoken');

const JWT_SECRET = '896a915cf8ba6e328e723c225d49adfc16378efdb40a1110fa3b23b3404328e0';

async function testUserLeads(userId, role, name) {
  const token = jwt.sign(
    { sub: userId, role, org_id: 'cmuev7n3o000mikew7je1tdiw' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`\n========================================`);
  console.log(`Testing API /leads for ${name} (${role})`);
  console.log(`User ID: ${userId}`);

  const res = await fetch('http://localhost:3001/api/v1/leads?limit=500', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.data) {
    console.log(`Total count in meta:`, json.meta?.total);
    console.log(`Number of leads returned:`, json.data.length);
    json.data.slice(0, 3).forEach(l => {
      console.log(` - Lead: ${l.firstName} ${l.lastName}, status: ${l.status?.name}, owner: ${l.owner?.firstName || 'none'}`);
    });
  } else {
    console.log(`Response:`, json);
  }
}

async function run() {
  await testUserLeads('cmuev7ni70016ikew8an7tdw8', 'ADMIN', 'Anurag Sharma');
  await testUserLeads('cmukv4tgl000n7d2d65001ydp', 'TEAM_LEADER', 'Sachin Puri');
}

run().catch(console.error);
