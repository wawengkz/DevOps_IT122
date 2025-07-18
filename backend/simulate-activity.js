const {
  aiResponseTimeHistogram,
  tutoringSessions,
  questionCounter,
  activeSessions,
  activeUsers,
  dbConnections,
  errorCounter,
  userActionsTotal,
  learningOutcomes,
  contentInteractions,
  studyStreaks,
  sessionDurationHistogram,
  questionComplexityHistogram,
  recordAIResponse,
  recordQuestion,
  recordUserAction,
  recordLearningOutcome,
  recordSessionDuration,
} = require("./metrics");

// Enhanced Activity Simulator for BrainBytes
class EnhancedActivitySimulator {
  constructor() {
    this.subjects = ["math", "science", "english", "history", "filipino"];
    this.gradeLevels = ["elementary", "junior_high", "senior_high"];
    this.complexities = ["basic", "intermediate", "advanced"];
    this.questionStatuses = ["answered", "pending", "failed"];
    this.questionTypes = ["multiple_choice", "essay", "problem_solving", "definition"];
    this.userTypes = ["student", "teacher", "parent"];
    this.platforms = ["web", "mobile", "tablet"];
    this.learningOutcomeTypes = ["concept_mastered", "skill_improved", "knowledge_gained"];
    this.contentTypes = ["video", "exercise", "quiz", "reading"];
    this.interactionTypes = ["view", "complete", "bookmark", "share"];
    
    this.activeSessionsCount = 0;
    this.activeUsersCount = 0;
    this.userSessions = new Map(); // Track user sessions for realistic duration
    this.studyStreakData = new Map(); // Track study streaks
    
    console.log("🚀 Enhanced BrainBytes Activity Simulator initialized!");
  }

  // Simulate a comprehensive tutoring session
  simulateTutoringSession() {
    const subject = this.getRandomElement(this.subjects);
    const gradeLevel = this.getRandomElement(this.gradeLevels);
    const userType = this.getRandomElement(this.userTypes);
    const platform = this.getRandomElement(this.platforms);
    const sessionType = this.getRandomElement(["regular", "exam_prep", "homework_help"]);
    const userId = `user_${Math.floor(Math.random() * 1000)}`;
    
    console.log(`📚 Starting enhanced tutoring session:`);
    console.log(`   Subject: ${subject}, Grade: ${gradeLevel}, User: ${userType}, Platform: ${platform}`);

    // Record session start
    tutoringSessions.labels(subject, gradeLevel, sessionType).inc();
    recordUserAction("session_start", userType, platform);
    
    // Update active sessions and users
    this.activeSessionsCount++;
    this.activeUsersCount++;
    activeSessions.labels(subject, userType).set(this.activeSessionsCount);
    activeUsers.labels(userType, platform).set(this.activeUsersCount);
    
    // Track session start time
    const sessionStartTime = Date.now();
    this.userSessions.set(userId, {
      startTime: sessionStartTime,
      subject,
      userType,
      platform,
      questionsAsked: 0,
      interactionsCount: 0
    });
    
    // Update study streak
    this.updateStudyStreak(userId, subject);
    
    // Simulate session activity
    this.simulateSessionActivity(userId, subject, gradeLevel, userType, platform);
    
    // Schedule session end
    const sessionDuration = Math.random() * 3600 + 300; // 5 minutes to 1 hour
    setTimeout(() => {
      this.endSession(userId, sessionDuration);
    }, sessionDuration * 1000);
  }

  // Simulate detailed session activity
  simulateSessionActivity(userId, subject, gradeLevel, userType, platform) {
    const session = this.userSessions.get(userId);
    if (!session) return;
    
    // Simulate multiple questions and interactions
    const activityCount = Math.floor(Math.random() * 8) + 2; // 2-10 activities
    
    for (let i = 0; i < activityCount; i++) {
      setTimeout(() => {
        const activity = Math.random();
        
        if (activity < 0.6) {
          // 60% chance of asking a question
          this.simulateEnhancedQuestion(userId, subject, gradeLevel, userType);
        } else if (activity < 0.8) {
          // 20% chance of content interaction
          this.simulateContentInteraction(userId, subject, userType);
        } else {
          // 20% chance of learning outcome
          this.simulateLearningOutcome(userId, subject, gradeLevel);
        }
      }, i * 2000 + Math.random() * 3000); // Stagger activities
    }
  }

  // Enhanced question simulation
  simulateEnhancedQuestion(userId, subject, gradeLevel, userType) {
    const session = this.userSessions.get(userId);
    if (!session) return;
    
    const complexity = this.getRandomElement(this.complexities);
    const questionType = this.getRandomElement(this.questionTypes);
    const status = this.getRandomElement(this.questionStatuses);
    
    console.log(`❓ Enhanced question: ${subject} (${complexity}, ${questionType}) - ${status}`);
    
    // Record question with enhanced details
    recordQuestion(subject, gradeLevel, status, questionType);
    
    // Record question complexity
    const complexityScore = this.calculateComplexityScore(complexity, questionType);
    questionComplexityHistogram.labels(subject, gradeLevel).observe(complexityScore);
    
    // Simulate AI response
    this.simulateEnhancedAIResponse(subject, complexity, questionType);
    
    // Update session tracking
    session.questionsAsked++;
    
    // Occasionally simulate errors based on complexity
    if (complexity === "advanced" && Math.random() < 0.15) {
      this.simulateError("ai_processing_complex", "/api/question", "warning");
    }
  }

  // Enhanced AI response simulation
  simulateEnhancedAIResponse(subject, complexity, questionType) {
    // Calculate response time based on complexity and question type
    let baseTime = 0.5;
    
    // Complexity factor
    switch (complexity) {
      case "basic": baseTime = 0.3; break;
      case "intermediate": baseTime = 1.2; break;
      case "advanced": baseTime = 2.8; break;
    }
    
    // Question type factor
    switch (questionType) {
      case "multiple_choice": baseTime *= 0.7; break;
      case "definition": baseTime *= 0.8; break;
      case "essay": baseTime *= 1.8; break;
      case "problem_solving": baseTime *= 2.2; break;
    }
    
    // Add randomness and potential network delays
    const responseTime = baseTime + Math.random() * 1.5;
    const modelType = this.getRandomElement(["gpt-3.5", "gpt-4", "local-model"]);
    
    console.log(`🤖 Enhanced AI response: ${responseTime.toFixed(2)}s (${modelType})`);
    
    // Record AI response with enhanced details
    recordAIResponse(subject, complexity, responseTime, modelType);
  }

  // Simulate content interactions
  simulateContentInteraction(userId, subject, userType) {
    const session = this.userSessions.get(userId);
    if (!session) return;
    
    const contentType = this.getRandomElement(this.contentTypes);
    const interactionType = this.getRandomElement(this.interactionTypes);
    
    console.log(`📖 Content interaction: ${interactionType} ${contentType} (${subject})`);
    
    // Record content interaction
    contentInteractions.labels(interactionType, contentType, subject).inc();
    
    // Update session tracking
    session.interactionsCount++;
    
    // Record user action
    recordUserAction(`content_${interactionType}`, userType, session.platform);
  }

  // Simulate learning outcomes
  simulateLearningOutcome(userId, subject, gradeLevel) {
    const outcomeType = this.getRandomElement(this.learningOutcomeTypes);
    
    console.log(`🎯 Learning outcome: ${outcomeType} in ${subject} (${gradeLevel})`);
    
    // Record learning outcome
    recordLearningOutcome(outcomeType, subject, gradeLevel);
  }

  // Update study streak tracking
  updateStudyStreak(userId, subject) {
    const currentStreak = this.studyStreakData.get(`${userId}_${subject}`) || 0;
    const newStreak = currentStreak + 1;
    
    this.studyStreakData.set(`${userId}_${subject}`, newStreak);
    studyStreaks.labels(userId, subject).set(newStreak);
    
    console.log(`🔥 Study streak updated: ${userId} - ${subject}: ${newStreak} days`);
  }

  // End session with comprehensive metrics
  endSession(userId, actualDuration) {
    const session = this.userSessions.get(userId);
    if (!session) return;
    
    // Calculate actual session duration
    const duration = actualDuration || (Date.now() - session.startTime) / 1000;
    
    console.log(`✅ Session ended: ${session.subject} (${duration.toFixed(0)}s)`);
    console.log(`   Questions: ${session.questionsAsked}, Interactions: ${session.interactionsCount}`);
    
    // Record session duration
    recordSessionDuration(session.userType, session.platform, session.subject, duration);
    
    // Record session end action
    recordUserAction("session_end", session.userType, session.platform);
    
    // Update active counters
    this.activeSessionsCount = Math.max(0, this.activeSessionsCount - 1);
    this.activeUsersCount = Math.max(0, this.activeUsersCount - 1);
    
    activeSessions.labels(session.subject, session.userType).set(this.activeSessionsCount);
    activeUsers.labels(session.userType, session.platform).set(this.activeUsersCount);
    
    // Clean up session data
    this.userSessions.delete(userId);
  }

  // Calculate complexity score for histogram
  calculateComplexityScore(complexity, questionType) {
    let score = 0.5; // Base score
    
    switch (complexity) {
      case "basic": score = 0.2; break;
      case "intermediate": score = 0.5; break;
      case "advanced": score = 0.8; break;
    }
    
    // Adjust based on question type
    switch (questionType) {
      case "multiple_choice": score *= 0.8; break;
      case "definition": score *= 0.9; break;
      case "essay": score *= 1.2; break;
      case "problem_solving": score *= 1.3; break;
    }
    
    return Math.min(1.0, score); // Cap at 1.0
  }

  // Enhanced database activity simulation
  simulateEnhancedDBActivity() {
    // Simulate realistic database connection patterns
    const peakHours = new Date().getHours();
    const isPeakTime = peakHours >= 18 && peakHours <= 22;
    
    const baseConnections = isPeakTime ? 25 : 15;
    const activeConnections = Math.floor(Math.random() * 15) + baseConnections;
    const idleConnections = Math.floor(Math.random() * 10) + 5;
    
    dbConnections.labels("active", "mongodb").set(activeConnections);
    dbConnections.labels("idle", "mongodb").set(idleConnections);
    
    console.log(`🗄️  Enhanced DB Activity - Active: ${activeConnections}, Idle: ${idleConnections} ${isPeakTime ? "(Peak Hours)" : ""}`);
    
    // Simulate connection issues during peak times
    if (isPeakTime && Math.random() < 0.1) {
      this.simulateError("database_connection", "/api/db", "critical");
    }
  }

  // Enhanced error simulation with context
  simulateError(type, endpoint, severity = "warning") {
    errorCounter.labels(type, endpoint, severity).inc();
    
    const errorMessages = {
      "network_timeout": "Network request timed out",
      "ai_processing_complex": "AI processing failed for complex query",
      "database_connection": "Database connection pool exhausted",
      "rate_limit": "Rate limit exceeded",
      "validation_error": "Input validation failed"
    };
    
    console.log(`❌ Enhanced error: ${type} at ${endpoint} (${severity})`);
    console.log(`   Message: ${errorMessages[type] || "Unknown error"}`);
  }

  // Simulate Philippine-specific usage patterns
  simulatePhilippineUsagePatterns() {
    const currentHour = new Date().getHours();
    const isPeakStudyTime = (currentHour >= 18 && currentHour <= 22) || 
                           (currentHour >= 8 && currentHour <= 17);
    
    if (isPeakStudyTime) {
      // Increase activity during peak study hours
      const extraSessions = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < extraSessions; i++) {
        setTimeout(() => {
          this.simulateTutoringSession();
        }, i * 1000);
      }
      
      console.log(`🇵🇭 Philippine peak study time detected (${currentHour}:00) - boosting activity`);
    }
    
    // Simulate typhoon season effects (reduced activity)
    if (Math.random() < 0.05) { // 5% chance
      console.log(`🌀 Simulating weather-related connectivity issues`);
      this.simulateError("network_timeout", "/api/weather", "warning");
    }
  }

  // Simulate mobile-specific issues
  simulateMobileIssues() {
    if (Math.random() < 0.15) { // 15% chance
      const issues = [
        "slow_network",
        "battery_optimization",
        "background_processing",
        "memory_pressure"
      ];
      
      const issue = this.getRandomElement(issues);
      this.simulateError(issue, "/api/mobile", "info");
    }
  }

  // Helper method to get random element from array
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generate realistic user behavior patterns
  generateUserBehaviorPattern() {
    const patterns = [
      { name: "quick_learner", sessionDuration: 600, questionsPerSession: 3 },
      { name: "deep_learner", sessionDuration: 2400, questionsPerSession: 8 },
      { name: "exam_crammer", sessionDuration: 1800, questionsPerSession: 12 },
      { name: "casual_browser", sessionDuration: 300, questionsPerSession: 1 }
    ];
    
    return this.getRandomElement(patterns);
  }

  // Start the enhanced simulation
  start() {
    console.log("🚀 Starting Enhanced BrainBytes Activity Simulation...");
    console.log("✨ Features: Enhanced metrics, Philippine patterns, realistic user behavior");
    
    // Main tutoring sessions - variable frequency
    setInterval(() => {
      const sessionCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < sessionCount; i++) {
        setTimeout(() => {
          this.simulateTutoringSession();
        }, i * 2000);
      }
    }, Math.random() * 8000 + 5000); // 5-13 seconds
    
    // Enhanced DB activity monitoring
    setInterval(() => {
      this.simulateEnhancedDBActivity();
    }, 10000);
    
    // Philippine-specific patterns
    setInterval(() => {
      this.simulatePhilippineUsagePatterns();
    }, 60000); // Check every minute
    
    // Mobile-specific issues
    setInterval(() => {
      this.simulateMobileIssues();
    }, 30000); // Check every 30 seconds
    
    // Occasional system errors
    setInterval(() => {
      if (Math.random() < 0.2) {
        const errorTypes = [
          "network_timeout",
          "rate_limit",
          "validation_error",
          "memory_pressure"
        ];
        const endpoints = [
          "/api/question",
          "/api/session",
          "/api/user",
          "/api/materials"
        ];
        
        this.simulateError(
          this.getRandomElement(errorTypes),
          this.getRandomElement(endpoints),
          Math.random() < 0.3 ? "critical" : "warning"
        );
      }
    }, 25000);
    
    // Periodic cleanup of old study streaks
    setInterval(() => {
      const streakEntries = Array.from(this.studyStreakData.entries());
      if (streakEntries.length > 100) {
        // Remove oldest entries
        streakEntries.slice(0, 20).forEach(([key]) => {
          this.studyStreakData.delete(key);
        });
        console.log("🧹 Cleaned up old study streak data");
      }
    }, 300000); // Every 5 minutes
    
    console.log("✅ Enhanced simulation started successfully!");
    console.log("📊 Check metrics at: http://localhost:9091");
    console.log("🎯 Monitor alerts at: http://localhost:9093");
    console.log("Press Ctrl+C to stop the simulation");
  }

  // Method to get current simulation statistics
  getStats() {
    return {
      activeSessions: this.activeSessionsCount,
      activeUsers: this.activeUsersCount,
      totalTrackedSessions: this.userSessions.size,
      studyStreaksTracked: this.studyStreakData.size,
      simulationUptime: Date.now() - this.startTime
    };
  }
}

// Start the simulation if this file is run directly
if (require.main === module) {
  const simulator = new EnhancedActivitySimulator();
  simulator.startTime = Date.now();
  simulator.start();
  
  // Add graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📊 Final simulation statistics:');
    console.log(JSON.stringify(simulator.getStats(), null, 2));
    console.log('👋 Enhanced BrainBytes Activity Simulator stopped');
    process.exit(0);
  });
}

module.exports = EnhancedActivitySimulator;