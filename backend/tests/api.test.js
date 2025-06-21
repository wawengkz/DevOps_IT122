// tests/api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('API Endpoints', () => {
    let server;
    
    beforeAll(async () => {
        // Wait for MongoDB connection
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve();
            } else {
                mongoose.connection.on('connected', resolve);
            }
        });
        
        // Start the server for testing
        const PORT = process.env.TEST_PORT || 3001; // Use different port for tests
        server = app.listen(PORT);
        
        // Wait a moment for the server to start
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        // Don't close mongoose connection here as it might be used by other tests
    });

    describe('Health Endpoint', () => {
        test('GET / should return 200 status', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('BrainBytes');
        });

        test('GET /health should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('healthy');
            expect(response.body).toHaveProperty('mongodb');
        });
    });

    describe('Message Endpoints', () => {
        test('POST /api/messages should handle message requests', async () => {
            const testMessage = {
                text: 'What is 2+2?',
                userId: 'test-user'
            };

            const response = await request(app)
                .post('/api/messages')
                .send(testMessage)
                .expect(201);

            expect(response.body).toHaveProperty('userMessage');
            expect(response.body).toHaveProperty('aiMessage');
            expect(response.body.userMessage.text).toBe(testMessage.text);
            expect(response.body.aiMessage.isUser).toBe(false);
        });

        test('GET /api/messages should return messages array', async () => {
            const response = await request(app)
                .get('/api/messages')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('User Profile Endpoints', () => {
        let userId;

        test('POST /api/users should create a user profile', async () => {
            const userData = {
                name: 'Test User',
                email: `test-${Date.now()}@example.com`,
                preferredSubjects: ['math', 'science']
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('_id');
            expect(response.body.user.name).toBe(userData.name);
            expect(response.body.user.email).toBe(userData.email);
            
            userId = response.body.user._id;
        });

        test('GET /api/users should return users array', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.users)).toBe(true);
        });

        test('GET /api/users/:id should return specific user', async () => {
            if (userId) {
                const response = await request(app)
                    .get(`/api/users/${userId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.user).toHaveProperty('_id', userId);
            }
        });

        test('DELETE /api/users/:id should delete user', async () => {
            if (userId) {
                const response = await request(app)
                    .delete(`/api/users/${userId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('deleted');
            }
        });
    });

    describe('Learning Materials Endpoints', () => {
        let materialId;

        test('POST /api/materials should create learning material', async () => {
            const materialData = {
                subject: 'math',
                topic: 'algebra',
                content: 'Basic algebra concepts and formulas'
            };

            const response = await request(app)
                .post('/api/materials')
                .send(materialData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.material).toHaveProperty('_id');
            expect(response.body.material.subject).toBe(materialData.subject);
            
            materialId = response.body.material._id;
        });

        test('GET /api/materials should return materials array', async () => {
            const response = await request(app)
                .get('/api/materials')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.materials)).toBe(true);
        });

        test('DELETE /api/materials/:id should delete material', async () => {
            if (materialId) {
                const response = await request(app)
                    .delete(`/api/materials/${materialId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('deleted');
            }
        });
    });

    describe('Error Handling', () => {
        test('Should handle invalid endpoints gracefully', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });

        test('Should handle malformed POST requests', async () => {
            const response = await request(app)
                .post('/api/messages')
                .send({ invalidField: 'invalid data' })
                .expect(400);

            console.log('Malformed request handled correctly');
        });
    });
});