const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Run user journey tests first, then integration tests
    const userJourneyTests = tests.filter(test => 
      test.path.includes('user-journey')
    );
    const integrationTests = tests.filter(test => 
      test.path.includes('integration')
    );
    const otherTests = tests.filter(test => 
      !test.path.includes('user-journey') && !test.path.includes('integration')
    );
    
    return [...userJourneyTests, ...integrationTests, ...otherTests];
  }
}

module.exports = CustomSequencer;