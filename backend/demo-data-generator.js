// BrainBytes 5-Minute Demo Script (Fixed)
// File: backend/demo-data-generator.js

const http = require("http");

/**
 * Fast 5-Minute BrainBytes Demo
 * Generates realistic monitoring data quickly for presentations
 */
class FastBrainBytesDemo {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.isRunning = false;
    this.currentUsers = 0;

    // Fast scenarios - 5 minutes total
    this.scenarios = {
      baseline: {
        name: "Healthy Baseline",
        users: 25,
        duration: 45, // 45 seconds
        errorRate: 0.01,
        subjects: ["math", "science", "english"],
        description: "Normal operation - system healthy",
      },
      school_peak: {
        name: "School Hours Peak",
        users: 80,
        duration: 60, // 1 minute
        errorRate: 0.04,
        subjects: ["math", "science", "english", "filipino"],
        description: "Increased usage during Philippine school hours",
      },
      evening_peak: {
        name: "Evening Study Peak",
        users: 200,
        duration: 75, // 1 minute 15 seconds
        errorRate: 0.12,
        subjects: ["math", "science", "english", "history"],
        description: "Peak homework help time (6-10 PM PHT)",
      },
      weather_impact: {
        name: "Weather Impact",
        users: 40,
        duration: 60, // 1 minute
        errorRate: 0.3,
        subjects: ["math", "english"],
        description: "Typhoon affecting connectivity",
      },
      recovery: {
        name: "System Recovery",
        users: 50,
        duration: 60, // 1 minute
        errorRate: 0.02,
        subjects: ["math", "science", "english"],
        description: "Returning to normal operation",
      },
    };

    console.log("🎬 Fast BrainBytes Demo (5 minutes) initialized");
  }

  /**
   * Make HTTP request to generate metrics
   */
  async makeRequest(endpoint = "/health", method = "GET", timeout = 5000) {
    return new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: 3000,
        path: endpoint,
        method: method,
        timeout: timeout,
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            Math.random() > 0.25 ? "Mobile-Android" : "Desktop-Chrome",
        },
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            data,
            endpoint,
            responseTime: Math.random() * 3 + 0.5,
          });
        });
      });

      req.on("error", () => {
        resolve({
          status: 500,
          error: "Network error",
          endpoint,
          responseTime: timeout / 1000,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          status: 408,
          error: "Timeout",
          endpoint,
          responseTime: timeout / 1000,
        });
      });

      // For POST requests
      if (method === "POST" && endpoint === "/api/messages") {
        const questions = [
          "What is photosynthesis?",
          "How do you solve 2x + 5 = 15?",
          "Explain the water cycle",
          "What is the capital of Philippines?",
          "How do you find the area of a circle?",
        ];

        const questionData = JSON.stringify({
          text: this.getRandomElement(questions),
          userId: `demo_user_${Math.floor(Math.random() * 100)}`,
          subject: this.getRandomElement(["math", "science", "english"]),
        });

        req.write(questionData);
      }

      req.end();
    });
  }

  /**
   * Generate fast traffic burst for scenario
   */
  async generateFastTraffic(scenarioKey) {
    const scenario = this.scenarios[scenarioKey];
    if (!scenario) {
      console.error(`❌ Unknown scenario: ${scenarioKey}`);
      return;
    }

    console.log(`\n🎯 ${scenario.name} (${scenario.duration}s)`);
    console.log(`📝 ${scenario.description}`);
    console.log(`👥 Simulating ${scenario.users} users`);

    const startTime = Date.now();
    const endTime = startTime + scenario.duration * 1000;
    let requestCount = 0;

    while (Date.now() < endTime && this.isRunning) {
      const batchSize = Math.min(8, Math.floor(scenario.users / 15)); // Smaller batches for speed
      const requests = [];

      for (let i = 0; i < batchSize; i++) {
        // Request type distribution
        const rand = Math.random();
        let endpoint, method;

        if (rand < 0.4) {
          endpoint = "/health";
          method = "GET";
        } else if (rand < 0.7) {
          endpoint = "/api/messages";
          method = "POST";
        } else if (rand < 0.9) {
          endpoint = "/api/users";
          method = "GET";
        } else {
          endpoint = "/metrics";
          method = "GET";
        }

        // Inject errors based on scenario
        if (Math.random() < scenario.errorRate) {
          endpoint = "/nonexistent-endpoint";
        }

        requests.push(this.makeRequest(endpoint, method, 3000));
      }

      try {
        const results = await Promise.allSettled(requests);
        requestCount += results.length;

        // Log scenario-specific events
        this.logScenarioEvent(scenario, requestCount);
      } catch (error) {
        console.log(`⚠️ Request batch error: ${error.message}`);
      }

      // Short delay between batches
      await this.delay(2000); // 2 seconds
    }

    console.log(`✅ ${scenario.name} completed (${requestCount} requests)`);
  }

  /**
   * Log interesting events during scenarios
   */
  logScenarioEvent(scenario, requestCount) {
    const events = {
      "Healthy Baseline": [
        "✅ System health optimal",
        "📊 Normal traffic patterns",
        "🔍 Baseline metrics established",
      ],
      "School Hours Peak": [
        "🏫 Teacher activity detected",
        "📚 Classroom questions increasing",
        "👨‍🎓 Student engagement rising",
      ],
      "Evening Study Peak": [
        "📖 Homework help surge detected",
        "🚨 Performance alerts triggered",
        "⚡ Auto-scaling recommended",
        "📱 High mobile usage detected",
      ],
      "Weather Impact": [
        "🌀 Network instability detected",
        "📶 Connection drops increasing",
        "🔄 Retry mechanisms activated",
        "⚠️ Regional service degradation",
      ],
      "System Recovery": [
        "🔄 Performance improving",
        "✅ Error rates normalizing",
        "📈 Recovery metrics positive",
        "🎯 Baseline performance restored",
      ],
    };

    const scenarioEvents = events[scenario.name] || [
      "📊 Generating traffic...",
    ];

    // Show events periodically
    if (requestCount % 15 === 0) {
      const event = this.getRandomElement(scenarioEvents);
      console.log(`   ${event}`);
    }

    // Show alerts for problematic scenarios
    if (scenario.errorRate > 0.1 && requestCount % 20 === 0) {
      console.log(
        `🚨 ALERT: High error rate (${(scenario.errorRate * 100).toFixed(1)}%)`,
      );
    }

    if (scenario.users > 150 && requestCount % 25 === 0) {
      console.log(`⚠️ ALERT: High load (${scenario.users} concurrent users)`);
    }
  }

  /**
   * Run complete 5-minute demo
   */
  async startFastDemo() {
    console.log("\n🎬 =====================================");
    console.log("🎬 BRAINBYTES 5-MINUTE FAST DEMO START");
    console.log("🎬 =====================================\n");

    this.isRunning = true;
    const totalStartTime = Date.now();

    console.log("⚡ Fast demo showcasing:");
    console.log("   ✅ Philippine educational patterns");
    console.log("   ✅ Real-time error monitoring");
    console.log("   ✅ Load-based alerting");
    console.log("   ✅ Weather impact simulation");
    console.log("   ✅ System recovery\n");

    console.log("🌐 Monitor live at:");
    console.log("   📊 Grafana: http://localhost:3001");
    console.log("   📈 Prometheus: http://localhost:9091");
    console.log("   🚨 Alertmanager: http://localhost:9093\n");

    try {
      // Test backend connection
      console.log("🔗 Testing backend connection...");
      const healthCheck = await this.makeRequest("/health", "GET", 3000);
      if (healthCheck.status === 200) {
        console.log("✅ Backend responsive\n");
      } else {
        console.log("⚠️ Backend may be starting up, continuing demo\n");
      }

      // Phase 1: Baseline (45s)
      await this.generateFastTraffic("baseline");
      await this.delay(3000);

      // Phase 2: School Peak (60s)
      await this.generateFastTraffic("school_peak");
      await this.delay(3000);

      // Phase 3: Evening Peak (75s)
      await this.generateFastTraffic("evening_peak");
      await this.delay(3000);

      // Phase 4: Weather Impact (60s)
      await this.generateFastTraffic("weather_impact");
      await this.delay(3000);

      // Phase 5: Recovery (60s)
      await this.generateFastTraffic("recovery");
    } catch (error) {
      console.error("❌ Demo error:", error.message);
    }

    const totalDuration = (Date.now() - totalStartTime) / 1000;

    console.log("\n🎉 ===============================");
    console.log("🎉 FAST DEMO COMPLETED SUCCESSFULLY");
    console.log("🎉 ===============================\n");

    console.log(`⏱️ Total duration: ${totalDuration.toFixed(1)} seconds`);
    console.log("📊 Generated realistic traffic patterns");
    console.log("🚨 Triggered multiple alert scenarios");
    console.log("📱 Simulated Philippine usage patterns\n");

    console.log("🎯 Key demonstrations:");
    console.log("   ✅ Error spike detection");
    console.log("   ✅ Load-based alerting");
    console.log("   ✅ Weather impact resilience");
    console.log("   ✅ Educational context awareness");
    console.log("   ✅ Mobile-first optimization\n");

    console.log("📋 Next: Review dashboards for generated data!");
  }

  /**
   * Ultra-quick 2-minute demo
   */
  async runUltraQuick() {
    console.log("⚡ ULTRA-QUICK 2-MINUTE DEMO");
    this.isRunning = true;

    // Override durations for ultra-fast demo
    Object.keys(this.scenarios).forEach((key) => {
      this.scenarios[key].duration = 20; // 20 seconds each
    });

    try {
      await this.generateFastTraffic("baseline");
      await this.generateFastTraffic("evening_peak");
      await this.generateFastTraffic("weather_impact");
      await this.generateFastTraffic("recovery");
    } catch (error) {
      console.error("❌ Ultra-quick demo error:", error.message);
    }

    console.log("⚡ Ultra-quick demo completed!");
  }

  /**
   * Single scenario demo
   */
  async runSingleScenario(scenarioKey) {
    console.log(`🎯 Single scenario: ${scenarioKey}`);
    this.isRunning = true;

    try {
      await this.generateFastTraffic(scenarioKey);
    } catch (error) {
      console.error(`❌ Scenario ${scenarioKey} error:`, error.message);
    }

    console.log(`✅ Scenario ${scenarioKey} completed`);
  }

  /**
   * Stop demo
   */
  stop() {
    this.isRunning = false;
    console.log("\n🛑 Demo stopped");
  }

  /**
   * Safe random element selector
   */
  getRandomElement(array) {
    if (!array || !Array.isArray(array) || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * List available scenarios
   */
  listScenarios() {
    console.log("📋 Available scenarios:");
    Object.entries(this.scenarios).forEach(([key, scenario]) => {
      console.log(`  ${key}: ${scenario.description} (${scenario.duration}s)`);
    });
  }
}

// Command line interface
if (require.main === module) {
  const demo = new FastBrainBytesDemo();
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
⚡ BrainBytes Fast Demo Script (5 minutes)

Usage:
  node demo-data-generator-fast.js [options]

Options:
  --fast              Run 5-minute complete demo
  --ultra             Run 2-minute ultra-quick demo
  --scenario <name>   Run single scenario
  --list              List available scenarios
  --help              Show this help

Available scenarios:
  baseline       - Healthy system (45s)
  school_peak    - School hours (60s) 
  evening_peak   - Evening study peak (75s)
  weather_impact - Weather simulation (60s)
  recovery       - System recovery (60s)

Examples:
  node demo-data-generator-fast.js --fast
  node demo-data-generator-fast.js --ultra
  node demo-data-generator-fast.js --scenario evening_peak
    `);
    process.exit(0);
  }

  if (args.includes("--list")) {
    demo.listScenarios();
    process.exit(0);
  }

  if (args.includes("--fast") || args.includes("--full")) {
    demo.startFastDemo().catch(console.error);
  } else if (args.includes("--ultra")) {
    demo.runUltraQuick().catch(console.error);
  } else if (args.includes("--scenario")) {
    const scenarioIndex = args.indexOf("--scenario");
    const scenario = args[scenarioIndex + 1];
    if (scenario && demo.scenarios[scenario]) {
      demo.runSingleScenario(scenario).catch(console.error);
    } else {
      console.error("❌ Please specify a valid scenario");
      demo.listScenarios();
    }
  } else {
    console.log("⚡ BrainBytes Fast Demo (5 minutes)");
    console.log("Quick start: node demo-data-generator.js --full");
    console.log("Use --help for all options");
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    demo.stop();
    process.exit(0);
  });
}

module.exports = FastBrainBytesDemo;
