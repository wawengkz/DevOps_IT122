const fetch = require('node-fetch');

// Initialize our AI service
const initializeAI = () => {
    console.log('Hugging Face AI service initialized');

    // Check if the token is available
    if (!process.env.HUGGINGFACE_TOKEN) {
        console.warn('Warning: HUGGINGFACE_TOKEN environment variable not set. API calls may fail.');
    }
};

// 1. EXPANDED TRAINING DATA - With focus on math, science, and history
const subjects = {
    math: ['calculate', 'math', 'equation', 'algebra', 'geometry', 'calculus', 'trigonometry', 'arithmetic', 'number', 'formula', 'solve', 'computation', 'theorem', 'polynomial', 'fraction', 'decimal', 'probability', 'statistics'],
    science: ['science', 'biology', 'chemistry', 'physics', 'experiment', 'laboratory', 'molecule', 'element', 'atom', 'cell', 'organism', 'ecosystem', 'evaporation', 'precipitation', 'water', 'chemical', 'energy', 'force', 'reaction', 'planet', 'solar system', 'gravity', 'dna', 'evolution', 'genetics'],
    history: ['history', 'capital', 'war', 'president', 'century', 'ancient', 'civilization', 'revolution', 'empire', 'kingdom', 'philippines', 'country', 'nation', 'battle', 'treaty', 'monarchy', 'democracy', 'dynasty', 'colonization', 'independence', 'world war', 'civil war', 'expedition', 'exploration']
};

// 2. QUESTION TYPE DETECTION - New function to detect question types
function detectQuestionType(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Definitions
    if (lowerQuestion.startsWith('what is') || 
        lowerQuestion.startsWith('define') || 
        lowerQuestion.startsWith('what are') || 
        lowerQuestion.includes('meaning of')) {
        return 'definition';
    }
    
    // Explanations
    if (lowerQuestion.startsWith('how does') || 
        lowerQuestion.startsWith('how do') || 
        lowerQuestion.startsWith('why does') || 
        lowerQuestion.startsWith('why do') || 
        lowerQuestion.startsWith('explain') || 
        lowerQuestion.includes('how come')) {
        return 'explanation';
    }
    
    // Examples
    if (lowerQuestion.includes('example') || 
        lowerQuestion.includes('instance') || 
        lowerQuestion.includes('illustration') || 
        lowerQuestion.startsWith('show me') || 
        lowerQuestion.includes('such as')) {
        return 'example';
    }
    
    // Comparisons
    if (lowerQuestion.includes('difference between') || 
        lowerQuestion.includes('compare') || 
        lowerQuestion.includes('versus') || 
        lowerQuestion.includes(' vs ')) {
        return 'comparison';
    }
    
    // Problem solving
    if (lowerQuestion.includes('solve') || 
        lowerQuestion.includes('calculate') || 
        lowerQuestion.includes('find the value') || 
        lowerQuestion.includes('compute')) {
        return 'problem';
    }
    
    return 'general';
}

// 3. SENTIMENT ANALYSIS - New function to detect user sentiment
function detectSentiment(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Detect frustration
    const frustrationIndicators = [
        'not working', 'doesn\'t work', 'frustrated', 'annoying', 'annoyed',
        'stupid', 'useless', 'waste of time', 'terrible', 'horrible',
        'awful', 'bad', 'worst', 'ridiculous', 'i give up', 'not helpful',
        'wrong', 'incorrect', 'mistake', 'error', 'not right', 'fail'
    ];
    
    // Detect confusion
    const confusionIndicators = [
        'confused', 'don\'t understand', 'do not understand', 'unclear',
        'what do you mean', 'makes no sense', 'confusing', 'lost',
        'clarify', 'explain again', 'still don\'t get it', 'complex',
        'complicated', 'difficult to follow', 'help me understand'
    ];
    
    // Check for indicators
    if (frustrationIndicators.some(indicator => lowerQuestion.includes(indicator))) {
        return 'frustrated';
    }
    
    if (confusionIndicators.some(indicator => lowerQuestion.includes(indicator))) {
        return 'confused';
    }
    
    return 'neutral';
}

// Function to get response from Hugging Face API
async function generateResponse(question) {
    // Define categories based on content
    const lowerQuestion = question.toLowerCase();
    
    // Detect subject category from question
    let category = detectSubject(question);
    
    // Detect question type (definition, explanation, example)
    const questionType = detectQuestionType(question);
    
    // Detect user sentiment
    const sentiment = detectSentiment(question);

    // Check for direct matches to provide immediate responses without API call
    const directResponse = getDirectResponse(lowerQuestion);
    if (directResponse) {
        return {
            category,
            questionType,
            sentiment,
            response: directResponse
        };
    }

    // For other questions, try the API with a strict timeout
    try {
        // 4. ENHANCED AI COMPONENT - Using a more capable model when available
        const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

        // Format the question based on category and question type
        let input = formatPrompt(question, category, questionType);

        // Get the token from environment variables
        const token = process.env.HUGGINGFACE_TOKEN;

        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Make the API request with authentication and timeout
        const response = await fetch(API_URL, {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                inputs: input,
                options: {
                    wait_for_model: false // Don't wait for model to be ready - faster responses
                }
            }),
        });

        // Clear the timeout since we got a response
        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);

            // If we get a 504 or other error, use our fallback
            return {
                category,
                questionType,
                sentiment,
                response: getDetailedResponse(category, questionType, question, sentiment)
            };
        }

        const result = await response.json();

        // Check if we got a valid response from the API
        if (result && result[0] && result[0].generated_text) {
            // Add sentiment-based response adjustment
            let finalResponse = result[0].generated_text;
            if (sentiment === 'frustrated' || sentiment === 'confused') {
                finalResponse = addSentimentResponse(finalResponse, sentiment);
            }
            
            return {
                category,
                questionType,
                sentiment,
                response: finalResponse
            };
        } else {
            // Use our fallback if the response format wasn't as expected
            return {
                category,
                questionType,
                sentiment,
                response: getDetailedResponse(category, questionType, question, sentiment)
            };
        }
    } catch (error) {
        console.error("Error calling Hugging Face API:", error);

        // Return a fallback response
        return {
            category,
            questionType,
            sentiment,
            response: getDetailedResponse(category, questionType, question, sentiment)
        };
    }
}

// Helper function to format the prompt based on question type and category
function formatPrompt(question, category, questionType) {
    let prompt = question;
    
    // Format based on question type
    if (questionType === 'definition') {
        prompt = `Define the following term in detail: ${question}`;
    } else if (questionType === 'explanation') {
        prompt = `Explain thoroughly how this works: ${question}`;
    } else if (questionType === 'example') {
        prompt = `Provide several specific examples for: ${question}`;
    } else if (questionType === 'comparison') {
        prompt = `Compare and contrast in detail: ${question}`;
    } else if (questionType === 'problem') {
        prompt = `Solve this problem step by step: ${question}`;
    }
    
    // Add category context
    if (category === 'math') {
        prompt = `${prompt}. Provide a mathematical explanation.`;
    } else if (category === 'science') {
        prompt = `${prompt}. Answer with scientific accuracy.`;
    } else if (category === 'history') {
        prompt = `${prompt}. Include relevant historical context.`;
    }
    
    return prompt;
}

// Detect subject category from question
function detectSubject(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Check for math equations
    if (/[+\-*\/=]/.test(lowerQuestion) || /\d+/.test(lowerQuestion)) {
        return 'math';
    }
    
    // Check each subject's keywords
    for (const [subject, keywords] of Object.entries(subjects)) {
        if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
            return subject;
        }
    }
    
    return 'general';
}

// Add sentiment-based response adjustment
function addSentimentResponse(response, sentiment) {
    if (sentiment === 'frustrated') {
        return `I understand this might be frustrating. Let me try to help: ${response}`;
    } else if (sentiment === 'confused') {
        return `I see you might be a bit confused. Let me explain this more clearly: ${response}`;
    }
    return response;
}

// Direct responses for common questions
function getDirectResponse(question) {
    const directResponses = {
        // Math responses
        'what is 1+1': "The answer to 1+1 is 2.",
        '1+1': "The answer to 1+1 is 2.",
        'what is the pythagorean theorem': "The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. It is expressed as a² + b² = c², where c is the length of the hypotenuse and a and b are the lengths of the other two sides.",
        'what is pi': "Pi (π) is a mathematical constant defined as the ratio of a circle's circumference to its diameter. It's approximately equal to 3.14159, though it's an irrational number with an infinite, non-repeating decimal representation. Pi is used in numerous mathematical formulas, especially those involving circles, spheres, and other curved shapes.",
        'what is calculus': "Calculus is a branch of mathematics that studies continuous change and motion. It has two main branches: differential calculus (concerning rates of change and slopes of curves) and integral calculus (concerning accumulation of quantities and the areas under curves). Calculus provides tools for solving problems in science, engineering, economics, and many other fields.",
        
        // Science responses
        'what is evaporation': "Evaporation is the process where liquid water changes into water vapor (gas). This happens when water molecules gain enough energy from heat to break free from the liquid's surface. Evaporation occurs at temperatures below water's boiling point and is a key part of the water cycle. It happens all around us - from wet clothes drying to puddles disappearing after rain.",
        'what is science': "Science is the systematic study of the natural world through observation, experimentation, and the formulation and testing of hypotheses. It aims to discover patterns and principles that help us understand how things work. The scientific method involves making observations, asking questions, forming hypotheses, conducting experiments, analyzing data, and drawing conclusions. Science encompasses many fields including physics, chemistry, biology, astronomy, geology, and more.",
        'what is photosynthesis': "Photosynthesis is the process by which green plants, algae, and certain bacteria convert light energy, usually from the sun, into chemical energy in the form of glucose or other sugars. The process primarily takes place in plant leaves and requires carbon dioxide, water, and sunlight. Chlorophyll, the green pigment in plants, captures the light energy. During photosynthesis, plants release oxygen as a byproduct, which is essential for most life on Earth.",
        'what is dna': "DNA (Deoxyribonucleic Acid) is a molecule that carries the genetic instructions for the development, functioning, growth, and reproduction of all known organisms. DNA consists of two long strands that form a double helix structure. Each strand is made up of smaller units called nucleotides, which contain a sugar, a phosphate group, and one of four types of nitrogen-containing bases: adenine (A), thymine (T), guanine (G), or cytosine (C). The sequence of these bases determines the genetic information.",
        'what is gravity': "Gravity is the natural force by which objects with mass attract one another. On Earth, gravity gives weight to objects and causes them to fall toward the ground when dropped. Isaac Newton's law of universal gravitation describes gravity as a force that acts between any two masses, while Einstein's general theory of relativity explains gravity as a curvature of spacetime caused by mass and energy. Gravity plays a crucial role in forming stars, planets, and galaxies, and keeps Earth and other planets in orbit around the Sun.",
        
        // History responses
        'what is the capital of the philippines': "The capital of the Philippines is Manila. It's located on the island of Luzon and serves as the country's political, economic, and cultural center.",
        'who discovered america': "The question of who discovered America has multiple answers depending on context. Indigenous peoples first arrived thousands of years ago, likely crossing a land bridge from Asia. Viking explorer Leif Erikson reached North America around 1000 CE, establishing a settlement in Newfoundland. Christopher Columbus's voyage in 1492 began sustained European contact. Each represents a 'discovery' from different perspectives, though the term is problematic as indigenous populations already inhabited the Americas.",
        'what is the french revolution': "The French Revolution (1789-1799) was a period of radical social and political upheaval in France that fundamentally transformed the country's governmental structure from an absolute monarchy to a republic based on the principles of liberty, equality, and fraternity. Triggered by financial crisis, social inequalities, and Enlightenment ideals, it began with the storming of the Bastille prison and led to the execution of King Louis XVI, the Reign of Terror, and eventually Napoleon Bonaparte's rise to power.",
        'what caused world war 2': "World War II (1939-1945) was caused by multiple interconnected factors: 1) The harsh terms of the Treaty of Versailles following World War I, which humiliated Germany and created economic hardship; 2) The Great Depression, which intensified economic nationalism and extremist politics; 3) The rise of fascism, particularly Nazi Germany under Adolf Hitler, with aggressive expansionist policies; 4) The failure of appeasement policies by Western powers; 5) Japan's militaristic expansion in Asia; and 6) The collapse of international cooperation through the League of Nations.",
        'who was julius caesar': "Julius Caesar (100-44 BCE) was a Roman general, statesman, and consul who played a critical role in the events that led to the demise of the Roman Republic and the rise of the Roman Empire. Caesar expanded Roman territory through successful military campaigns, particularly in Gaul. After crossing the Rubicon River with his army in 49 BCE, he defeated Pompey in a civil war and became dictator of Rome. His political reforms and centralization of power threatened the traditional republican system. Caesar was assassinated by a group of senators on March 15 (the Ides of March), 44 BCE."
    };
    
    return directResponses[question.toLowerCase()];
}

// More detailed fallback responses when the API call fails
function getDetailedResponse(category, questionType, question, sentiment) {
    // First check for direct match responses
    const directResponse = getDirectResponse(question.toLowerCase());
    if (directResponse) return directResponse;
    
    // Category-specific responses
    const categoryResponses = {
        science: {
            definition: "In science, definitions are precise statements that explain the meaning of terms. This scientific concept refers to observable phenomena that can be studied through the scientific method. Scientists use careful observations and experiments to understand these concepts better.",
            explanation: "Scientific explanations describe how natural processes work based on evidence and established theories. This process involves several interrelated steps and follows fundamental scientific principles established through extensive research and experimentation.",
            example: "Here are some examples from science: 1) Water freezing at 0°C is an example of a phase change, 2) Photosynthesis in plants demonstrates energy conversion from light to chemical energy, 3) Gravity causing objects to fall illustrates fundamental forces.",
            comparison: "When comparing scientific concepts, we look at their underlying mechanisms, applications, and relationships to established theories. Different scientific phenomena often share common principles but manifest in unique ways across various contexts.",
            problem: "To solve this science problem, we need to apply the relevant scientific principles and formulas. The solution involves identifying the key variables, applying the appropriate equations, and interpreting the results in context.",
            general: "This is an interesting science question! Science helps us understand the natural world through systematic observation and experimentation. The scientific method provides a framework for investigating phenomena and developing explanations based on evidence."
        },
        math: {
            definition: "In mathematics, definitions are precise statements that establish the meaning of mathematical objects, concepts, or symbols. This mathematical concept has specific properties that distinguish it from other related concepts in mathematics.",
            explanation: "Mathematical explanations involve logical reasoning and proofs based on axioms and previously established theorems. This process follows step-by-step logic that shows how mathematical truths are derived from fundamental principles.",
            example: "Here are some mathematical examples: 1) The equation x² + 1 = 0 has two complex solutions: i and -i, 2) The Fibonacci sequence (1,1,2,3,5,8...) demonstrates how each number is the sum of the two preceding ones, 3) A right triangle with sides 3, 4, and 5 satisfies the Pythagorean theorem.",
            comparison: "When comparing mathematical concepts, we examine their properties, applications, and relationships to other mathematical structures. Different mathematical objects may share certain characteristics while differing in important ways.",
            problem: "To solve this math problem, I'll break it down into steps: 1) Identify what we're looking for, 2) Apply relevant formulas or operations, 3) Solve step-by-step, and 4) Verify the solution satisfies all conditions.",
            general: "Mathematics involves the study of numbers, quantities, shapes, and patterns. To approach this question, we need to apply logical reasoning and possibly specific mathematical techniques relevant to the topic."
        },
        history: {
            definition: "In historical studies, definitions help establish the scope and significance of historical events, periods, or concepts. This historical concept has specific characteristics that developed within particular social, political, and cultural contexts.",
            explanation: "Historical explanations examine the causes, effects, and significance of events within their broader context. This historical process involved multiple factors including social, economic, political, and cultural influences that shaped how events unfolded.",
            example: "Historical examples include: 1) The American Revolution (1775-1783) established independence from British rule, 2) The Industrial Revolution transformed manufacturing and society in the 18th-19th centuries, 3) The Renaissance period saw renewed interest in classical learning and arts in Europe from the 14th-17th centuries.",
            comparison: "When comparing historical events or periods, historians consider factors such as causes, consequences, key figures, and broader impacts. Different historical phenomena often reflect both unique circumstances and common patterns in human experience.",
            problem: "To address this historical question, we need to consider multiple perspectives, examine primary and secondary sources, and place events in their proper context while acknowledging the limitations of historical knowledge.",
            general: "This is an interesting historical question! History helps us understand past events and their significance. Historians examine evidence from various sources to develop interpretations about what happened and why it matters."
        },
        general: {
            definition: "Definitions establish the meaning and scope of concepts by identifying their essential characteristics. This concept refers to specific ideas or phenomena that can be understood through their properties and relationships.",
            explanation: "Explanations describe how things work or why they occur by identifying causal relationships and underlying principles. This process involves several interconnected factors that contribute to the observed outcomes or phenomena.",
            example: "Here are some examples that illustrate this concept: 1) [First relevant example], 2) [Second relevant example], 3) [Third relevant example]. These examples demonstrate different aspects or applications of the concept.",
            comparison: "When comparing these concepts, we consider their key features, functions, and relationships. These different approaches or ideas share some similarities while differing in important ways that affect their applications or implications.",
            problem: "To address this question, we need to break it down into components, apply relevant principles, and develop a solution that addresses all aspects of the problem.",
            general: "That's an interesting question! To give you the most helpful answer, I'd need a bit more information about what specific aspect you're interested in learning about."
        }
    };
    
    // Get response based on category and question type
    let response = "";
    if (categoryResponses[category] && categoryResponses[category][questionType]) {
        response = categoryResponses[category][questionType];
    } else {
        response = "I don't have specific information about that topic, but I'm happy to help with general questions about science, math, or history.";
    }
    
    // Add sentiment-based responses
    if (sentiment === 'frustrated') {
        return `I understand this might be frustrating. Let me try to help: ${response}`;
    } else if (sentiment === 'confused') {
        return `I see you might be looking for clearer information. Let me explain: ${response}`;
    }
    
    return response;
}

module.exports = {
    initializeAI,
    generateResponse
};