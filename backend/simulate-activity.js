const {
  aiResponseTimeHistogram,
  tutoringSessions,
  questionCounter,
  activeSessions,
  dbConnections,
  errorCounter
} = require('./metrics');

// Simulate realistic BrainBytes activity
class ActivitySimulator {
  constructor() {
    this.subjects = ['math', 'science', 'english', 'history', 'filipino'];
    this.gradeLevels = ['elementary', 'junior_high', 'senior_high'];
    this.complexities = ['basic', 'intermediate', 'advanced'];
    this.questionStatuses = ['answered', 'pending', 'failed'];
    this.activeSessionsCount = 0;
  }

  // Simulate a tutoring session
  simulateTutoringSession() {
    const subject = this.getRandomElement(this.subjects);
    const gradeLevel = this.getRandomElement(this.gradeLevels);
    
    console.log(`📚 Starting tutoring session: ${subject} - ${gradeLevel}`);
    
    // Increment session counter
    tutoringSessions.labels(subject, gradeLevel).inc();
    
    // Simulate active session
    this.activeSessionsCount++;
    activeSessions.labels(subject).set(this.activeSessionsCount);
    
    // Simulate multiple questions in this session
    const questionCount = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < questionCount; i++) {
      setTimeout(() => {
        this.simulateQuestion(subject, gradeLevel);
      }, i * 1000);
    }
    
    // End session after some time
    setTimeout(() => {
      this.activeSessionsCount = Math.max(0, this.activeSessionsCount - 1);
      activeSessions.labels(subject).set(this.activeSessionsCount);
      console.log(`✅ Session ended: ${subject}`);
    }, (questionCount + 2) * 1000);
  }

  // Simulate asking a question
  simulateQuestion(subject, gradeLevel) {
    const status = this.getRandomElement(this.questionStatuses);
    const complexity = this.getRandomElement(this.complexities);
    
    console.log(`❓ Question asked: ${subject} (${complexity}) - ${status}`);
    
    // Increment question counter
    questionCounter.labels(subject, gradeLevel, status).inc();
    
    // Simulate AI response time
    this.simulateAIResponse(subject, complexity);
    
    // Occasionally simulate errors
    if (Math.random() < 0.1) {
      this.simulateError('ai_processing', '/api/question');
    }
  }

  // Simulate AI response time
  simulateAIResponse(subject, complexity) {
    // More complex subjects take longer
    let baseTime = 0.5;
    if (complexity === 'intermediate') baseTime = 1.2;
    if (complexity === 'advanced') baseTime = 2.5;
    
    // Add some randomness
    const responseTime = baseTime + (Math.random() * 1.5);
    
    console.log(`🤖 AI response time: ${responseTime.toFixed(2)}s`);
    
    // Record the response time
    aiResponseTimeHistogram.labels(subject, complexity).observe(responseTime);
  }

  // Simulate database connections
  simulateDBActivity() {
    // Simulate fluctuating DB connections
    const activeConnections = Math.floor(Math.random() * 10) + 5;
    const idleConnections = Math.floor(Math.random() * 5) + 2;
    
    dbConnections.labels('active').set(activeConnections);
    dbConnections.labels('idle').set(idleConnections);
    
    console.log(`🗄️  DB Connections - Active: ${activeConnections}, Idle: ${idleConnections}`);
  }

  // Simulate errors
  simulateError(type, endpoint) {
    errorCounter.labels(type, endpoint).inc();
    console.log(`❌ Error occurred: ${type} at ${endpoint}`);
  }

  // Helper method to get random element from array
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Start the simulation
  start() {
    console.log('🚀 Starting BrainBytes activity simulation...');
    
    // Simulate tutoring sessions every 3-8 seconds
    setInterval(() => {
      this.simulateTutoringSession();
    }, Math.random() * 5000 + 3000);
    
    // Simulate DB activity every 10 seconds
    setInterval(() => {
      this.simulateDBActivity();
    }, 10000);
    
    // Simulate occasional errors
    setInterval(() => {
      if (Math.random() < 0.3) {
        const errorTypes = ['network_timeout', 'ai_processing', 'database_error'];
        const endpoints = ['/api/question', '/api/session', '/api/user'];
        
        this.simulateError(
          this.getRandomElement(errorTypes),
          this.getRandomElement(endpoints)
        );
      }
    }, 15000);
    
    console.log('✨ Simulation started! Check your Prometheus metrics at http://localhost:9091');
    console.log('Press Ctrl+C to stop the simulation');
  }
}

// Start the simulation if this file is run directly
if (require.main === module) {
  const simulator = new ActivitySimulator();
  simulator.start();
}

module.exports = ActivitySimulator;