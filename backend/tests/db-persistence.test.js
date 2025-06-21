// tests/db-persistence.test.js
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Test data model
const testSchema = new mongoose.Schema({
    testId: String,
    testData: String,
    createdAt: { type: Date, default: Date.now }
});

const TestModel = mongoose.model('TestData', testSchema);

describe('Database Persistence Tests', () => {
    let testId;
    
    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbytes_test';
        await mongoose.connect(mongoUri);
        testId = `test-${Date.now()}`;
    });

    afterAll(async () => {
        // Clean up and close connection
        try {
            await TestModel.deleteOne({ testId });
        } catch (error) {
            console.log('Cleanup error (expected in CI):', error.message);
        }
        await mongoose.connection.close();
    });

    test('Should insert test data into database', async () => {
        const testData = new TestModel({
            testId,
            testData: 'This is test data for persistence verification'
        });
        
        const savedData = await testData.save();
        expect(savedData.testId).toBe(testId);
        expect(savedData.testData).toContain('test data');
        
        console.log(`Test data inserted successfully: ${testId}`);
    });

    test('Should verify data persistence in MongoDB', async () => {
        // In CI environment, we can't restart containers, so we'll just verify the data exists
        const retrievedData = await TestModel.findOne({ testId });
        
        expect(retrievedData).toBeTruthy();
        expect(retrievedData.testId).toBe(testId);
        expect(retrievedData.testData).toContain('test data');
        
        console.log('Data persistence verified! Data exists in database.');
    });

    test('Should retrieve data after simulated restart', async () => {
        // Close and reconnect to simulate restart
        await mongoose.connection.close();
        
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbytes_test';
        await mongoose.connect(mongoUri);
        
        // Try to retrieve the data
        const retrievedData = await TestModel.findOne({ testId });
        
        expect(retrievedData).toBeTruthy();
        expect(retrievedData.testId).toBe(testId);
        
        console.log('Data retrieved successfully after reconnection');
    });

    test('Should verify MongoDB is running and accessible', async () => {
        // Test MongoDB connection health
        const connectionState = mongoose.connection.readyState;
        expect(connectionState).toBe(1); // 1 = connected
        
        // Test database operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        expect(collections).toBeDefined();
        expect(Array.isArray(collections)).toBe(true);
        
        console.log('MongoDB connection verified and healthy');
        
        // Clean up test data
        await TestModel.deleteOne({ testId });
        console.log('Test data cleaned up');
    });
});