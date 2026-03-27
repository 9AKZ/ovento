const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://192.168.56.1:4000/api/auth/register', {
      email: 'test_user2@example.com',
      password: 'MotDePasse123!',
      fullName: 'Test User2'
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    console.log('status', res.status, res.data);
  } catch (err) {
    if (err.response) console.error('status', err.response.status, err.response.data);
    else console.error('err', err.message);
  }
})();