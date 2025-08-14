const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './apps/api/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Create JWT token for the test user (matching seeded user data)
const payload = {
  userId: 'test-user-id', // This will need to match the actual user ID from database
  email: 'test@flowcraft.io',
  organizationId: 'test-org-1',
  role: 'ADMIN'
};

const token = jwt.sign(payload, JWT_SECRET, { 
  expiresIn: '24h',
  issuer: 'flowcraft-api' 
});

console.log('JWT Secret:', JWT_SECRET);
console.log('Generated JWT Token:');
console.log(token);
console.log('\nTo use in API requests, add this header:');
console.log(`Authorization: Bearer ${token}`);

// Verify the token works
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\nToken verification successful:');
  console.log(decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}