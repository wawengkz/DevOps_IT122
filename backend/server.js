const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const aiService = require('./aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI model
aiService.initializeAI();

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/brainbytes', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Define schemas
const messageSchema = new mongoose.Schema({
    text: String,
    isUser: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    category: String,  // Add this line to store the category
    questionType: String  // Optional: store question type too
});

const Message = mongoose.model('Message', messageSchema);

// Define User Profile Schema
const userProfileSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    preferredSubjects: [String],
    createdAt: { type: Date, default: Date.now }
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Define Learning Materials Schema
const learningMaterialSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
    createdAt: { type: Date, default: Date.now }
});

const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema);

// API Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the BrainBytes API' });
});

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new message and get AI response
app.post('/api/messages', async (req, res) => {
    try {
        // Save user message
        const userMessage = new Message({
            text: req.body.text,
            isUser: true
        });
        await userMessage.save();
        // Generate AI response with a 15-second overall timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 15000)
        );

        const aiResultPromise = aiService.generateResponse(req.body.text);

        // Race between the AI response and the timeout
        const aiResult = await Promise.race([aiResultPromise, timeoutPromise])
            .catch(error => {
                console.error('AI response timed out or failed:', error);
                return {
                    category: 'error',
                    response: "I'm sorry, but I couldn't process your request in time. Please try again with a simpler question."
                };
            });

        // Save AI response
        const aiMessage = new Message({
            text: aiResult.response,
            isUser: false,
            category: aiResult.category,  // Add this line
            questionType: aiResult.questionType  // Optional
        });
        await aiMessage.save();

        // Return both messages
        res.status(201).json({
            userMessage,
            aiMessage,
            category: aiResult.category
        });
    } catch (err) {
        console.error('Error in /api/messages route:', err);
        res.status(400).json({ error: err.message });
    }
});

// User Profile CRUD Operations
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new UserProfile(req.body);
        const result = await newUser.save();
        res.json({ success: true, user: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await UserProfile.find();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await UserProfile.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await UserProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await UserProfile.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Learning Materials CRUD Operations
app.post('/api/materials', async (req, res) => {
    try {
        const newMaterial = new LearningMaterial(req.body);
        const result = await newMaterial.save();
        res.json({ success: true, material: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/materials', async (req, res) => {
    try {
        // Allow filtering by subject
        const filter = {};
        if (req.query.subject) filter.subject = req.query.subject;
        if (req.query.topic) filter.topic = req.query.topic;
        
        const materials = await LearningMaterial.find(filter);
        res.json({ success: true, materials });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/materials/:id', async (req, res) => {
    try {
        const material = await LearningMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
        res.json({ success: true, material });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/materials/:id', async (req, res) => {
    try {
        const material = await LearningMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
        res.json({ success: true, material });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        const material = await LearningMaterial.findByIdAndDelete(req.params.id);
        if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
        res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});