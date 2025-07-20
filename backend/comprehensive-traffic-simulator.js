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
  httpRequestsTotal,
  httpRequestDuration,
  mobilePlatformCounter,
  payloadSizeHistogram,
  connectionDropCounter,
  recordAIResponse,
  recordQuestion,
  recordUserAction,
  recordLearningOutcome,
  recordSessionDuration,
} = require("./metrics");

// Comprehensive Traffic Simulator for BrainBytes
class ComprehensiveTrafficSimulator {
  constructor() {
    // User behavior profiles
    this.userProfiles = {
      quick_learner: {
        sessionDuration: { min: 300, max: 900 }, // 5-15 minutes
        questionsPerSession: { min: 2, max: 5 },
        errorRate: 0.05, // 5% error rate
        complexityPreference: ["basic", "intermediate"],
        subjects: ["math", "science", "english"],
        platform: "mobile",
        peakHours: [19, 20, 21], // 7-9 PM
      },
      deep_learner: {
        sessionDuration: { min: 1800, max: 3600 }, // 30-60 minutes
        questionsPerSession: { min: 8, max: 15 },
        errorRate: 0.02, // 2% error rate
        complexityPreference: ["intermediate", "advanced"],
        subjects: ["math", "science", "history", "filipino"],
        platform: "desktop",
        peakHours: [18, 19, 20, 21, 22], // 6-10 PM
      },
      exam_crammer: {
        sessionDuration: { min: 600, max: 2400 }, // 10-40 minutes
        questionsPerSession: { min: 10, max: 20 },
        errorRate: 0.08, // 8% error rate
        complexityPreference: ["basic", "intermediate", "advanced"],
        subjects: ["math", "science", "english", "history"],
        platform: "mobile",
        peakHours: [17, 18, 19, 20, 21, 22, 23], // 5-11 PM
      },
      casual_browser: {
        sessionDuration: { min: 120, max: 600 }, // 2-10 minutes
        questionsPerSession: { min: 1, max: 3 },
        errorRate: 0.15, // 15% error rate
        complexityPreference: ["basic"],
        subjects: ["math", "english"],
        platform: "mobile",
        peakHours: [12, 13, 16, 17, 18, 19], // Lunch and evening
      },
      teacher_reviewer: {
        sessionDuration: { min: 900, max: 1800 }, // 15-30 minutes
        questionsPerSession: { min: 5, max: 10 },
        errorRate: 0.01, // 1% error rate
        complexityPreference: ["intermediate", "advanced"],
        subjects: ["math", "science", "english", "history", "filipino"],
        platform: "desktop",
        peakHours: [8, 9, 10, 14, 15, 16, 17], // School hours
      },
    };

    // Philippine-specific patterns
    this.philippinePatterns = {
      schoolHours: { start: 8, end: 17 }, // 8 AM - 5 PM
      peakStudyHours: { start: 18, end: 22 }, // 6-10 PM
      lunchBreak: { start: 12, end: 13 }, // 12-1 PM
      weekendPattern: { lighter: true, peakShift: 2 }, // Later peak on weekends
      weatherEvents: 0.05, // 5% chance of weather disruption
      powerOutages: 0.02, // 2% chance of power issues
      internetIssues: 0.08, // 8% chance of connectivity problems
    };

    // Network conditions in Philippines
    this.networkConditions = {
      excellent: { latency: 50, dropRate: 0.001, speed: 1.0 },
      good: { latency: 150, dropRate: 0.01, speed: 0.8 },
      moderate: { latency: 300, dropRate: 0.03, speed: 0.6 },
      poor: { latency: 800, dropRate: 0.08, speed: 0.3 },
      very_poor: { latency: 2000, dropRate: 0.15, speed: 0.1 },
    };

    // Simulation state
    this.activeUsers = new Map();
    this.activeSessions = new Map();
    this.studyStreaks = new Map();
    this.currentLoad = 0;
    this.peakLoadFactor = 1;
    this.networkCondition = "good";
    this.simulationMode = "normal";

    // Statistics
    this.stats = {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalErrors: 0,
      uptimePercentage: 100,
      startTime: Date.now(),
    };

    console.log("🚀 Comprehensive BrainBytes Traffic Simulator initialized!");
    console.log("📊 Profiles:", Object.keys(this.userProfiles).join(", "));
  }

  // Get current Philippine time context
  getPhilippineTimeContext() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      hour,
      dayOfWeek,
      isWeekend,
      isSchoolHours: hour >= 8 && hour <= 17 && !isWeekend,
      isPeakStudyHours: hour >= 18 && hour <= 22,
      isLunchBreak: hour >= 12 && hour <= 13,
      isNightTime: hour >= 23 || hour <= 5,
    };
  }

  // Calculate load factor based on time and context
  calculateLoadFactor() {
    const context = this.getPhilippineTimeContext();
    let loadFactor = 0.3; // Base load

    // Time-based adjustments
    if (context.isSchoolHours) {
      loadFactor = 0.6; // Moderate during school
    } else if (context.isPeakStudyHours) {
      loadFactor = 1.0; // Peak in evening
    } else if (context.isLunchBreak) {
      loadFactor = 0.4; // Slightly higher during lunch
    } else if (context.isNightTime) {
      loadFactor = 0.1; // Very low at night
    }

    // Weekend adjustments
    if (context.isWeekend) {
      loadFactor *= 0.7; // 30% reduction on weekends
      if (context.isPeakStudyHours) {
        loadFactor *= 1.2; // But still peak in evening
      }
    }

    // Random variation
    loadFactor *= 0.8 + Math.random() * 0.4; // ±20% variation

    return Math.max(0.1, Math.min(2.0, loadFactor));
  }

  // Simulate network conditions
  simulateNetworkConditions() {
    const random = Math.random();
    const context = this.getPhilippineTimeContext();

    // Worse conditions during peak hours
    if (context.isPeakStudyHours) {
      if (random < 0.1) this.networkCondition = "poor";
      else if (random < 0.3) this.networkCondition = "moderate";
      else if (random < 0.7) this.networkCondition = "good";
      else this.networkCondition = "excellent";
    } else {
      if (random < 0.05) this.networkCondition = "poor";
      else if (random < 0.15) this.networkCondition = "moderate";
      else if (random < 0.6) this.networkCondition = "good";
      else this.networkCondition = "excellent";
    }

    // Weather events
    if (Math.random() < this.philippinePatterns.weatherEvents) {
      this.networkCondition = "very_poor";
      console.log("🌀 Weather event affecting network conditions");
    }

    // Power outages
    if (Math.random() < this.philippinePatterns.powerOutages) {
      this.networkCondition = "very_poor";
      console.log("⚡ Power outage affecting connectivity");
    }
  }

  // Generate realistic user based on time context
  generateRealisticUser() {
    const context = this.getPhilippineTimeContext();
    const profiles = Object.keys(this.userProfiles);
    let selectedProfile;

    // Select profile based on time context
    if (context.isSchoolHours) {
      // During school hours, more teachers and casual browsers
      selectedProfile =
        Math.random() < 0.3
          ? "teacher_reviewer"
          : Math.random() < 0.6
            ? "casual_browser"
            : "quick_learner";
    } else if (context.isPeakStudyHours) {
      // Evening peak: more dedicated learners
      selectedProfile =
        Math.random() < 0.4
          ? "deep_learner"
          : Math.random() < 0.7
            ? "exam_crammer"
            : "quick_learner";
    } else if (context.isLunchBreak) {
      // Lunch break: quick sessions
      selectedProfile =
        Math.random() < 0.8 ? "casual_browser" : "quick_learner";
    } else {
      // Random distribution for other times
      selectedProfile = profiles[Math.floor(Math.random() * profiles.length)];
    }

    const profile = this.userProfiles[selectedProfile];
    const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      id: userId,
      profile: selectedProfile,
      config: profile,
      startTime: Date.now(),
      questionsAsked: 0,
      errorsEncountered: 0,
      currentSubject: this.getRandomElement(profile.subjects),
      platform: profile.platform,
      networkCondition: this.networkCondition,
    };
  }

  // Simulate a comprehensive user session
  async simulateUserSession(user) {
    const sessionId = `session_${user.id}`;
    const config = user.config;
    const sessionDuration = this.randomBetween(
      config.sessionDuration.min,
      config.sessionDuration.max,
    );
    const questionsToAsk = this.randomBetween(
      config.questionsPerSession.min,
      config.questionsPerSession.max,
    );

    console.log(
      `👤 User ${user.profile} started session: ${sessionDuration}s, ${questionsToAsk} questions`,
    );

    // Track session start
    this.activeSessions.set(sessionId, {
      userId: user.id,
      profile: user.profile,
      startTime: Date.now(),
      questionsAsked: 0,
      subject: user.currentSubject,
    });

    // Update metrics
    tutoringSessions
      .labels(user.currentSubject, "senior_high", "regular")
      .inc();
    recordUserAction("session_start", "student", user.platform);
    activeSessions.labels(user.currentSubject, "student").inc();
    activeUsers.labels("student", user.platform).inc();

    // Update study streak
    this.updateStudyStreak(user.id, user.currentSubject);

    // Simulate session activities
    const activityInterval = sessionDuration / (questionsToAsk + 2); // +2 for content interactions

    for (let i = 0; i < questionsToAsk; i++) {
      await this.delay(activityInterval * 1000);

      // Check if session should be interrupted
      if (this.shouldInterruptSession(user)) {
        console.log(`⚠️  Session interrupted for ${user.profile}`);
        this.recordSessionInterruption(user, "network_issue");
        break;
      }

      await this.simulateQuestionFlow(user, sessionId);

      // Occasional content interactions
      if (Math.random() < 0.3) {
        await this.simulateContentInteraction(user);
      }
    }

    // End session
    this.endUserSession(user, sessionId, sessionDuration);
  }

  // Simulate realistic question flow
  async simulateQuestionFlow(user, sessionId) {
    const complexity = this.getRandomElement(user.config.complexityPreference);
    const questionType = this.getRandomElement([
      "multiple_choice",
      "essay",
      "problem_solving",
      "definition",
    ]);
    const networkCondition = this.networkConditions[user.networkCondition];

    // Simulate question asking
    const questionStart = Date.now();

    // Record question
    recordQuestion(user.currentSubject, "senior_high", "pending", questionType);

    // Simulate question complexity scoring
    const complexityScore = this.calculateComplexityScore(
      complexity,
      questionType,
    );
    questionComplexityHistogram
      .labels(user.currentSubject, "senior_high")
      .observe(complexityScore);

    // Simulate AI processing with network effects
    const aiProcessingTime = this.calculateAIProcessingTime(
      complexity,
      questionType,
      networkCondition,
    );

    // Check for errors
    const shouldError = Math.random() < user.config.errorRate;
    if (shouldError) {
      this.simulateQuestionError(user, questionType);
      return;
    }

    // Simulate AI response
    await this.delay(aiProcessingTime * 1000);

    // Record successful AI response
    recordAIResponse(
      user.currentSubject,
      complexity,
      aiProcessingTime,
      "gpt-3.5",
    );
    recordQuestion(
      user.currentSubject,
      "senior_high",
      "answered",
      questionType,
    );

    // Update session tracking
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.questionsAsked++;
    }

    user.questionsAsked++;

    // Record learning outcome (chance based)
    if (Math.random() < 0.7) {
      // 70% chance of learning outcome
      const outcome = this.getRandomElement([
        "concept_mastered",
        "skill_improved",
        "knowledge_gained",
      ]);
      recordLearningOutcome(outcome, user.currentSubject, "senior_high");
    }

    console.log(
      `❓ ${user.profile} asked ${questionType} question (${complexity}) - ${aiProcessingTime.toFixed(2)}s`,
    );
  }

  // Simulate question errors
  simulateQuestionError(user, questionType) {
    const errorTypes = [
      "network_timeout",
      "ai_processing",
      "validation_error",
      "rate_limit",
    ];
    const errorType = this.getRandomElement(errorTypes);

    errorCounter.labels(errorType, "/api/messages", "warning").inc();
    recordQuestion(user.currentSubject, "senior_high", "failed", questionType);

    user.errorsEncountered++;
    this.stats.totalErrors++;

    console.log(`❌ ${user.profile} encountered error: ${errorType}`);
  }

  // Simulate content interactions
  async simulateContentInteraction(user) {
    const contentTypes = ["video", "exercise", "quiz", "reading"];
    const interactionTypes = ["view", "complete", "bookmark", "share"];

    const contentType = this.getRandomElement(contentTypes);
    const interactionType = this.getRandomElement(interactionTypes);

    contentInteractions
      .labels(interactionType, contentType, user.currentSubject)
      .inc();
    recordUserAction(`content_${interactionType}`, "student", user.platform);

    console.log(
      `📖 ${user.profile} - ${interactionType} ${contentType} (${user.currentSubject})`,
    );
  }

  // Check if session should be interrupted
  shouldInterruptSession(user) {
    const networkCondition = this.networkConditions[user.networkCondition];
    const interruptionChance = networkCondition.dropRate * 2; // Double the drop rate for interruptions

    return Math.random() < interruptionChance;
  }

  // Record session interruption
  recordSessionInterruption(user, reason) {
    connectionDropCounter.labels(reason, user.platform).inc();
    errorCounter.labels("session_interrupt", "/api/session", "warning").inc();

    // Reduce uptime percentage
    this.stats.uptimePercentage = Math.max(
      95,
      this.stats.uptimePercentage - 0.1,
    );
  }

  // Calculate AI processing time with network effects
  calculateAIProcessingTime(complexity, questionType, networkCondition) {
    let baseTime = 0.5;

    // Complexity factor
    switch (complexity) {
      case "basic":
        baseTime = 0.3;
        break;
      case "intermediate":
        baseTime = 1.2;
        break;
      case "advanced":
        baseTime = 2.8;
        break;
    }

    // Question type factor
    switch (questionType) {
      case "multiple_choice":
        baseTime *= 0.7;
        break;
      case "definition":
        baseTime *= 0.8;
        break;
      case "essay":
        baseTime *= 1.8;
        break;
      case "problem_solving":
        baseTime *= 2.2;
        break;
    }

    // Network condition factor
    baseTime *= 2 - networkCondition.speed; // Slower network = longer processing
    baseTime += networkCondition.latency / 1000; // Add latency

    // Random variation
    baseTime *= 0.7 + Math.random() * 0.6; // ±30% variation

    return Math.max(0.1, baseTime);
  }

  // Calculate complexity score
  calculateComplexityScore(complexity, questionType) {
    let score = 0.5;

    switch (complexity) {
      case "basic":
        score = 0.2;
        break;
      case "intermediate":
        score = 0.5;
        break;
      case "advanced":
        score = 0.8;
        break;
    }

    switch (questionType) {
      case "multiple_choice":
        score *= 0.8;
        break;
      case "definition":
        score *= 0.9;
        break;
      case "essay":
        score *= 1.2;
        break;
      case "problem_solving":
        score *= 1.3;
        break;
    }

    return Math.min(1.0, score);
  }

  // Update study streak
  updateStudyStreak(userId, subject) {
    const streakKey = `${userId}_${subject}`;
    const currentStreak = this.studyStreaks.get(streakKey) || 0;
    const newStreak = currentStreak + 1;

    this.studyStreaks.set(streakKey, newStreak);
    studyStreaks.labels(userId, subject).set(newStreak);
  }

  // End user session
  endUserSession(user, sessionId, duration) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Record session duration
    recordSessionDuration(
      "student",
      user.platform,
      user.currentSubject,
      duration,
    );

    // Record session end
    recordUserAction("session_end", "student", user.platform);

    // Update metrics
    activeSessions.labels(user.currentSubject, "student").dec();
    activeUsers.labels("student", user.platform).dec();

    // Update statistics
    this.stats.totalSessions++;
    this.stats.totalQuestions += user.questionsAsked;

    // Clean up
    this.activeSessions.delete(sessionId);
    this.activeUsers.delete(user.id);

    console.log(
      `✅ ${user.profile} session ended: ${duration}s, ${user.questionsAsked} questions, ${user.errorsEncountered} errors`,
    );
  }

  // Simulate database activity
  simulateDatabaseActivity() {
    const context = this.getPhilippineTimeContext();
    const loadFactor = this.calculateLoadFactor();

    // Base connections
    const baseActive = Math.floor(10 * loadFactor);
    const baseIdle = Math.floor(5 * loadFactor);

    // Add some randomness
    const activeConnections = Math.max(
      1,
      baseActive + Math.floor(Math.random() * 10) - 5,
    );
    const idleConnections = Math.max(
      0,
      baseIdle + Math.floor(Math.random() * 5) - 2,
    );

    dbConnections.labels("active", "mongodb").set(activeConnections);
    dbConnections.labels("idle", "mongodb").set(idleConnections);

    // Simulate connection issues during high load
    if (loadFactor > 0.8 && Math.random() < 0.1) {
      errorCounter.labels("database_connection", "/api/db", "critical").inc();
      console.log("🗄️  Database connection pressure detected");
    }
  }

  // Generate variable load patterns
  generateLoadPattern() {
    const context = this.getPhilippineTimeContext();
    const baseLoadFactor = this.calculateLoadFactor();

    // Calculate number of concurrent users
    const baseUsers = Math.floor(baseLoadFactor * 50); // Max 100 concurrent users
    const currentUsers = Math.max(
      1,
      baseUsers + Math.floor(Math.random() * 20) - 10,
    );

    console.log(
      `📊 Load pattern: ${currentUsers} users (factor: ${baseLoadFactor.toFixed(2)}, condition: ${this.networkCondition})`,
    );

    return currentUsers;
  }

  // Main simulation loop
  async startSimulation() {
    console.log("🚀 Starting Comprehensive BrainBytes Traffic Simulation");
    console.log("🌍 Configured for Philippine market patterns");
    console.log("📱 Mobile-first user behavior simulation");
    console.log("⏰ Time-aware load patterns");

    // Update network conditions every 30 seconds
    setInterval(() => {
      this.simulateNetworkConditions();
    }, 30000);

    // Update database activity every 10 seconds
    setInterval(() => {
      this.simulateDatabaseActivity();
    }, 10000);

    // Main user generation loop
    setInterval(() => {
      const targetUsers = this.generateLoadPattern();
      const currentActiveUsers = this.activeUsers.size;

      // Generate new users if below target
      if (currentActiveUsers < targetUsers) {
        const usersToGenerate = Math.min(5, targetUsers - currentActiveUsers); // Max 5 new users per cycle

        for (let i = 0; i < usersToGenerate; i++) {
          const user = this.generateRealisticUser();
          this.activeUsers.set(user.id, user);
          this.stats.totalUsers++;

          // Start user session (don't await to allow concurrent sessions)
          this.simulateUserSession(user).catch((error) => {
            console.error(`Error in user session ${user.id}:`, error);
          });
        }
      }
    }, 5000); // Every 5 seconds

    // Statistics reporting
    setInterval(() => {
      this.reportStatistics();
    }, 60000); // Every minute

    // Cleanup old data
    setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
  }

  // Report simulation statistics
  reportStatistics() {
    const context = this.getPhilippineTimeContext();
    const runtime = (Date.now() - this.stats.startTime) / 1000;

    console.log("\n📈 === SIMULATION STATISTICS ===");
    console.log(`⏱️  Runtime: ${Math.floor(runtime)}s`);
    console.log(
      `🌍 Context: ${context.isSchoolHours ? "School Hours" : context.isPeakStudyHours ? "Peak Study" : "Regular"}`,
    );
    console.log(`📊 Active Users: ${this.activeUsers.size}`);
    console.log(`📚 Active Sessions: ${this.activeSessions.size}`);
    console.log(`🔢 Total Users: ${this.stats.totalUsers}`);
    console.log(`📖 Total Questions: ${this.stats.totalQuestions}`);
    console.log(`❌ Total Errors: ${this.stats.totalErrors}`);
    console.log(`📶 Network: ${this.networkCondition}`);
    console.log(`⚡ Uptime: ${this.stats.uptimePercentage.toFixed(1)}%`);
    console.log("===============================\n");
  }

  // Cleanup old data
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Clean up old study streaks
    for (const [key, timestamp] of this.studyStreaks.entries()) {
      if (now - timestamp > maxAge) {
        this.studyStreaks.delete(key);
      }
    }

    console.log("🧹 Cleaned up old simulation data");
  }

  // Utility methods
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get current simulation state
  getSimulationState() {
    return {
      activeUsers: this.activeUsers.size,
      activeSessions: this.activeSessions.size,
      networkCondition: this.networkCondition,
      stats: { ...this.stats },
      runtime: (Date.now() - this.stats.startTime) / 1000,
    };
  }
}

// Export for use in other modules
module.exports = ComprehensiveTrafficSimulator;

// Start simulation if run directly
if (require.main === module) {
  const simulator = new ComprehensiveTrafficSimulator();
  simulator.startSimulation();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n📊 Final simulation state:");
    console.log(JSON.stringify(simulator.getSimulationState(), null, 2));
    console.log("👋 Comprehensive Traffic Simulator stopped");
    process.exit(0);
  });
}
