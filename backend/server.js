const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const aiService = require("./aiService");

// Try to load metrics with error handling
let metricsAvailable = false;
let metrics = {};

try {
  metrics = require("./metrics");
  metricsAvailable = true;
  console.log("✅ Prometheus metrics loaded successfully");
} catch (error) {
  console.warn("⚠️ Prometheus metrics not available:", error.message);
  console.warn(
    "📋 Rebuild container to enable metrics: docker-compose build --no-cache backend",
  );
  // Create dummy functions to prevent errors
  metrics = {
    register: null,
    metricsMiddleware: (req, res, next) => next(),
    aiResponseTimeHistogram: { labels: () => ({ observe: () => {} }) },
    questionCounter: { labels: () => ({ inc: () => {} }) },
    tutoringSessions: { labels: () => ({ inc: () => {} }) },
    dbConnections: { labels: () => ({ set: () => {} }) },
    errorCounter: { labels: () => ({ inc: () => {} }) },
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add metrics middleware only if available
if (metricsAvailable) {
  app.use(metrics.metricsMiddleware);
  console.log("📊 Metrics middleware enabled");
}

// Initialize AI model
aiService.initializeAI();

// Connect to MongoDB with modern configuration (removes deprecation warnings)
const mongoUri = process.env.MONGODB_URI || "mongodb://mongo:27017/brainbytes";
mongoose
  .connect(mongoUri, {
    // Removed deprecated options: useNewUrlParser, useUnifiedTopology
    retryWrites: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    if (metricsAvailable) {
      metrics.dbConnections.labels("active").set(1);
    }
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    if (metricsAvailable) {
      metrics.dbConnections.labels("active").set(0);
      metrics.errorCounter.labels("database", "connection").inc();
    }
  });

// Monitor MongoDB connection state
if (metricsAvailable) {
  mongoose.connection.on("connected", () => {
    metrics.dbConnections.labels("active").set(1);
  });

  mongoose.connection.on("disconnected", () => {
    metrics.dbConnections.labels("active").set(0);
  });
}

// Define schemas
const messageSchema = new mongoose.Schema({
  text: String,
  isUser: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  category: String, // Subject category (math, science, history)
  questionType: String, // Type of question (definition, explanation, etc.)
  followUpQuestions: [String], // Array of suggested follow-up questions
  isFollowUp: { type: Boolean, default: false }, // Whether this is a follow-up response
  sentiment: String, // User's detected sentiment
});

const Message = mongoose.model("Message", messageSchema);

// Define User Profile Schema
const userProfileSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  preferredSubjects: [String],
  createdAt: { type: Date, default: Date.now },
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

// Define Learning Materials Schema
const learningMaterialSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
  createdAt: { type: Date, default: Date.now },
});

const LearningMaterial = mongoose.model(
  "LearningMaterial",
  learningMaterialSchema,
);

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the BrainBytes API" });
});

// Metrics endpoint with dynamic loading
app.get("/metrics", async (req, res) => {
  if (metricsAvailable && metrics.register) {
    res.set("Content-Type", metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } else {
    res.set("Content-Type", "text/plain");
    res.send(
      "# Metrics endpoint ready - prom-client not available\n# Rebuild container to enable full metrics: docker-compose build --no-cache backend\n# Check if prom-client is installed: docker-compose exec backend npm list prom-client\n",
    );
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    metricsAvailable: metricsAvailable,
  });
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/messages").inc();
    }
    res.status(500).json({ error: err.message });
  }
});

// Create a new message and get AI response
app.post("/api/messages", async (req, res) => {
  const aiStartTime = Date.now();

  try {
    // Get user ID (from request or use anonymous)
    const userId = req.body.userId || "anonymous";
    console.log(`Processing message for user: ${userId}`);

    // Save user message
    const userMessage = new Message({
      text: req.body.text,
      isUser: true,
    });
    await userMessage.save();

    // Generate AI response with a 15-second overall timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 15000),
    );

    // Pass the userId to maintain conversation context
    const aiResultPromise = aiService.generateResponse(req.body.text, userId);

    // Race between the AI response and the timeout
    const aiResult = await Promise.race([
      aiResultPromise,
      timeoutPromise,
    ]).catch((error) => {
      console.error("AI response timed out or failed:", error);
      if (metricsAvailable) {
        metrics.errorCounter.labels("ai_timeout", "/api/messages").inc();
      }
      return {
        category: "error",
        response:
          "I'm sorry, but I couldn't process your request in time. Please try again with a simpler question.",
        followUpQuestions: [],
        isFollowUp: false,
        questionType: "error",
        sentiment: "neutral",
      };
    });

    // Record AI response time metrics
    if (metricsAvailable) {
      const aiDuration = (Date.now() - aiStartTime) / 1000;
      const category = aiResult.category || "unknown";
      const complexity =
        aiResult.questionType === "definition"
          ? "basic"
          : aiResult.questionType === "explanation"
            ? "intermediate"
            : "advanced";

      metrics.aiResponseTimeHistogram
        .labels(category, complexity)
        .observe(aiDuration);
      metrics.questionCounter
        .labels(
          category,
          "unknown",
          aiResult.category === "error" ? "failed" : "answered",
        )
        .inc();
    }

    console.log(
      `AI response generated: Category=${aiResult.category}, IsFollowUp=${aiResult.isFollowUp}, QuestionType=${aiResult.questionType}`,
    );

    // Save AI response with all new properties
    const aiMessage = new Message({
      text: aiResult.response,
      isUser: false,
      category: aiResult.category,
      questionType: aiResult.questionType,
      followUpQuestions: aiResult.followUpQuestions || [],
      isFollowUp: aiResult.isFollowUp || false,
      sentiment: aiResult.sentiment || "neutral",
    });
    await aiMessage.save();

    // Return both messages with all properties
    res.status(201).json({
      userMessage,
      aiMessage,
    });
  } catch (err) {
    console.error("Error in /api/messages route:", err);
    if (metricsAvailable) {
      metrics.errorCounter.labels("general", "/api/messages").inc();
    }
    res.status(400).json({ error: err.message });
  }
});

// User Profile CRUD Operations
app.post("/api/users", async (req, res) => {
  try {
    const newUser = new UserProfile(req.body);
    const result = await newUser.save();
    res.json({ success: true, user: result });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("validation", "/api/users").inc();
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await UserProfile.find();
    res.json({ success: true, users });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/users").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await UserProfile.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/users/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/users/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/users/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Learning Materials CRUD Operations
app.post("/api/materials", async (req, res) => {
  try {
    const newMaterial = new LearningMaterial(req.body);
    const result = await newMaterial.save();

    // Record tutoring session metric based on subject
    if (metricsAvailable && req.body.subject) {
      metrics.tutoringSessions.labels(req.body.subject, "unknown").inc();
    }

    res.json({ success: true, material: result });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("validation", "/api/materials").inc();
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/materials", async (req, res) => {
  try {
    // Allow filtering by subject
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;

    const materials = await LearningMaterial.find(filter);
    res.json({ success: true, materials });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/materials").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/materials/:id", async (req, res) => {
  try {
    const material = await LearningMaterial.findById(req.params.id);
    if (!material)
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    res.json({ success: true, material });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/materials/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/materials/:id", async (req, res) => {
  try {
    const material = await LearningMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!material)
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    res.json({ success: true, material });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/materials/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/materials/:id", async (req, res) => {
  try {
    const material = await LearningMaterial.findByIdAndDelete(req.params.id);
    if (!material)
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    res.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    if (metricsAvailable) {
      metrics.errorCounter.labels("database", "/api/materials/:id").inc();
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  if (metricsAvailable) {
    console.log(
      `📊 Prometheus metrics available at http://localhost:${PORT}/metrics`,
    );
  } else {
    console.log(
      `⚠️  Basic metrics available at http://localhost:${PORT}/metrics`,
    );
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app; // Export for testing
