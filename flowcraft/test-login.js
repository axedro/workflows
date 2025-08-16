const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@flowcraft.com',
        password: 'password123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('Access Token:', data.tokens.accessToken.substring(0, 20) + '...');
      console.log('Refresh Token:', data.tokens.refreshToken.substring(0, 20) + '...');
      
      // Test the access token
      const userResponse = await fetch('http://localhost:3000/users/me', {
        headers: {
          'Authorization': `Bearer ${data.tokens.accessToken}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Token validation successful!');
        console.log('User:', userData.name, `(${userData.email})`);
      } else {
        console.log('❌ Token validation failed:', userResponse.status);
      }
    } else {
      const error = await response.json();
      console.log('❌ Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
