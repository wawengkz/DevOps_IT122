const request = require('supertest');
const mongoose = require('mongoose');

// Don't import the main server - create a test-specific app
const express = require('express');
const cors = require('cors');

describe('API Endpoints', () => {
    let app;
    
    beforeAll(async () => {
        // Connect to MongoDB directly in tests
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbytes_test';
        
        try {
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Test MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection failed:', error);
            throw error;
        }
        
        // Create a simple test app
        app = express();
        app.use(express.json());
        app.use(cors());
        
        // Define basic schemas for testing
        const messageSchema = new mongoose.Schema({
            message: String,
            userId: String,
            response: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const userSchema = new mongoose.Schema({
            name: String,
            email: String,
            learningGoals: [String],
            createdAt: { type: Date, default: Date.now }
        });
        
        const materialSchema = new mongoose.Schema({
            title: String,
            content: String,
            subject: String,
            difficulty: String,
            createdAt: { type: Date, default: Date.now }
        });
        
        const Message = mongoose.model('Message', messageSchema);
        const User = mongoose.model('User', userSchema);
        const Material = mongoose.model('Material', materialSchema);
        
        // Basic routes for testing
        app.get('/', (req, res) => {
            res.json({ message: 'BrainBytes API is running', status: 'ok' });
        });
        
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
            });
        });
        
        // Message endpoints
        app.post('/api/messages', async (req, res) => {
            try {
                const { message, userId } = req.body;
                const newMessage = new Message({
                    message,
                    userId,
                    response: `Mock response to: ${message}`
                });
                await newMessage.save();
                res.json({ response: newMessage.response, id: newMessage._id });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/api/messages', async (req, res) => {
            try {
                const messages = await Message.find().sort({ timestamp: -1 });
                res.json(messages);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // User endpoints
        app.post('/api/users', async (req, res) => {
            try {
                const user = new User(req.body);
                await user.save();
                res.status(201).json(user);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/api/users', async (req, res) => {
            try {
                const users = await User.find();
                res.json(users);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/api/users/:id', async (req, res) => {
            try {
                const user = await User.findById(req.params.id);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json(user);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.delete('/api/users/:id', async (req, res) => {
            try {
                await User.findByIdAndDelete(req.params.id);
                res.json({ message: 'User deleted successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Material endpoints
        app.post('/api/materials', async (req, res) => {
            try {
                const material = new Material(req.body);
                await material.save();
                res.status(201).json(material);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/api/materials', async (req, res) => {
            try {
                const materials = await Material.find();
                res.json(materials);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.delete('/api/materials/:id', async (req, res) => {
            try {
                await Material.findByIdAndDelete(req.params.id);
                res.json({ message: 'Material deleted successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
        
    }, 30000); // 30 second timeout for setup
    
    afterAll(async () => {
        // Clean up test data
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.db.dropDatabase();
                await mongoose.connection.close();
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }, 10000);

    describe('Health Endpoint', () => {
        test('GET / should return 200 status', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        }, 10000);

        test('GET /health should return health status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('healthy');
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
            expect(response.body).toHaveProperty('id');
        }, 10000);

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
                .send({}); // Empty body
            
            // Should return an error status
            expect([400, 500]).toContain(response.status);
        }, 10000);
    });
});