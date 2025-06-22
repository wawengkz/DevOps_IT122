const mongoose = require('mongoose');

describe('Database Persistence Tests', () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbytes_test';
  let testCollection;

  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Get test collection
    testCollection = mongoose.connection.db.collection('test_data');
  }, 30000);

  afterAll(async () => {
    // Clean up and close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
  });

  test('Should insert test data into database', async () => {
    const testData = {
      id: `test-${Date.now()}`,
      message: 'Test data for persistence check',
      timestamp: new Date()
    };

    const result = await testCollection.insertOne(testData);
    expect(result.insertedId).toBeDefined();

    console.log(`Test data inserted successfully: ${testData.id}`);
  });

  test('Should verify data persistence in MongoDB', async () => {
    const allData = await testCollection.find({}).toArray();
    expect(allData.length).toBeGreaterThan(0);

    console.log('Data persistence verified! Data exists in database.');
  });

  test('Should retrieve data after simulated restart', async () => {
    // Simulate a connection restart by closing and reopening
    await mongoose.connection.close();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    testCollection = mongoose.connection.db.collection('test_data');
    const retrievedData = await testCollection.find({}).toArray();

    expect(retrievedData.length).toBeGreaterThan(0);
    console.log('Data retrieved successfully after reconnection');
  });

  test('Should verify MongoDB is running and accessible', async () => {
    const result = await mongoose.connection.db.admin().ping();
    expect(result.ok).toBe(1);

    console.log('MongoDB connection verified and healthy');
  });
});
