const request = require('supertest');
const mongoose = require('mongoose');

describe('API Endpoints', () => {
    let app;
    let server;
    
    beforeAll(async () => {
        // Wait for MongoDB connection with longer timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MongoDB connection timeout'));
            }, 45000); // 45 seconds timeout
            
            const checkConnection = () => {
                if (mongoose.connection.readyState === 1) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(checkConnection, 1000);
                }
            };
            
            checkConnection();
        });
        
        // Import app after MongoDB is ready
        app = require('../server');
        
        // Wait a bit more for server to be fully ready
        await new Promise(resolve => setTimeout(resolve, 2000));
    }, 60000); // 60 second timeout for beforeAll
    
    afterAll(async () => {
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
        
        // Clean up test data
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.dropDatabase();
        }
        
        await mongoose.connection.close();
    }, 30000);

    describe('Health Endpoint', () => {
        test('GET / should return 200 status', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
        }, 10000);

        test('GET /health should return health status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
        }, 10000);
    });

    describe('Message Endpoints', () => {
        test('POST /api/messages should handle message requests', async () => {
            const testMessage = {
                message: 'Test message for API',
                userId: 'test-user-123'
            };

            const response = await request(app)
                .post('/api/messages')
                .send(testMessage);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('response');
        }, 15000);

        test('GET /api/messages should return messages array', async () => {
            const response = await request(app).get('/api/messages');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        }, 10000);
    });

    describe('User Profile Endpoints', () => {
        let createdUserId;

        test('POST /api/users should create a user profile', async () => {
            const testUser = {
                name: 'Test User',
                email: 'test@example.com',
                learningGoals: ['JavaScript', 'React']
            };

            const response = await request(app)
                .post('/api/users')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.name).toBe(testUser.name);
            
            createdUserId = response.body._id;
        }, 10000);

        test('GET /api/users should return users array', async () => {
            const response = await request(app).get('/api/users');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        }, 10000);

        test('GET /api/users/:id should return specific user', async () => {
            if (!createdUserId) {
                // Create a user first if none exists
                const testUser = {
                    name: 'Test User 2',
                    email: 'test2@example.com',
                    learningGoals: ['Node.js']
                };
                const createResponse = await request(app)
                    .post('/api/users')
                    .send(testUser);
                createdUserId = createResponse.body._id;
            }

            const response = await request(app).get(`/api/users/${createdUserId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id', createdUserId);
        }, 10000);

        test('DELETE /api/users/:id should delete user', async () => {
            if (!createdUserId) {
                // Create a user first if none exists
                const testUser = {
                    name: 'Test User 3',
                    email: 'test3@example.com',
                    learningGoals: ['MongoDB']
                };
                const createResponse = await request(app)
                    .post('/api/users')
                    .send(testUser);
                createdUserId = createResponse.body._id;
            }

            const response = await request(app).delete(`/api/users/${createdUserId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        }, 10000);
    });

    describe('Learning Materials Endpoints', () => {
        let createdMaterialId;

        test('POST /api/materials should create learning material', async () => {
            const testMaterial = {
                title: 'Test Learning Material',
                content: 'This is test content',
                subject: 'Computer Science',
                difficulty: 'beginner'
            };

            const response = await request(app)
                .post('/api/materials')
                .send(testMaterial);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.title).toBe(testMaterial.title);
            
            createdMaterialId = response.body._id;
        }, 10000);

        test('GET /api/materials should return materials array', async () => {
            const response = await request(app).get('/api/materials');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        }, 10000);

        test('DELETE /api/materials/:id should delete material', async () => {
            if (!createdMaterialId) {
                // Create a material first if none exists
                const testMaterial = {
                    title: 'Test Material 2',
                    content: 'Test content 2',
                    subject: 'Mathematics',
                    difficulty: 'intermediate'
                };
                const createResponse = await request(app)
                    .post('/api/materials')
                    .send(testMaterial);
                createdMaterialId = createResponse.body._id;
            }

            const response = await request(app).delete(`/api/materials/${createdMaterialId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        }, 10000);
    });

    describe('Error Handling', () => {
        test('Should handle invalid endpoints gracefully', async () => {
            const response = await request(app).get('/invalid/endpoint');
            expect(response.status).toBe(404);
        }, 10000);

        test('Should handle malformed POST requests', async () => {
            const response = await request(app)
                .post('/api/messages')
                .send({ invalid: 'data without required fields' });
            
            // Should either return 400 (bad request) or 500 (server error)
            expect([400, 500]).toContain(response.status);
        }, 10000);
    });
});