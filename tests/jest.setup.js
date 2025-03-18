const mongoose = require('mongoose');

// Configure long timeout for tests that need more time
jest.setTimeout(10000);

// Custom ENV variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.API_KEY = 'test-api-key';

// Use test database
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_database';

// The connection is already established in db.js when server.js is imported
// We just need to make sure tests don't interfere with each other

// After all tests complete in a file
afterAll(async () => {
  // Wait a bit to ensure all operations complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // Clean the collections instead of dropping the whole database
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    console.log('✅ Collections cleared for next test suite');
  } catch (error) {
    console.error('Error cleaning up database:', error);
  }
  
  // Don't close the connection as other test files might be using it
});
