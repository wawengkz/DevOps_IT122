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
    math: ['calculate', 'math', 'equation', 'algebra', 'geometry', 'calculus', 'trigonometry', 'arithmetic', 'number', 'formula', 'solve', 'computation', 'theorem', 'polynomial', 'fraction', 'decimal', 'probability', 'statistics', 'derivative', 'integral', 'function', 'matrix', 'vector', 'logarithm', 'exponent'],
    science: ['science', 'biology', 'chemistry', 'physics', 'experiment', 'laboratory', 'molecule', 'element', 'atom', 'cell', 'organism', 'ecosystem', 'evaporation', 'precipitation', 'water', 'chemical', 'energy', 'force', 'reaction', 'planet', 'solar system', 'gravity', 'dna', 'evolution', 'genetics', 'quantum', 'relativity', 'electromagnetic', 'neuron', 'climate', 'velocity', 'acceleration', 'momentum', 'photosynthesis', 'respiration'],
    history: ['history', 'capital', 'war', 'president', 'century', 'ancient', 'civilization', 'revolution', 'empire', 'kingdom', 'philippines', 'country', 'nation', 'battle', 'treaty', 'monarchy', 'democracy', 'dynasty', 'colonization', 'independence', 'world war', 'civil war', 'expedition', 'exploration', 'archaeological', 'artifact', 'migration', 'settlement', 'renaissance', 'reformation', 'industrial revolution', 'cold war', 'leader', 'conquest', 'indigenous']
};

// 2. ENHANCED QUESTION TYPE DETECTION
function detectQuestionType(question) {
    const lowerQuestion = question.toLowerCase();
   
    // Definitions
    if (lowerQuestion.startsWith('what is') ||
        lowerQuestion.startsWith('define') ||
        lowerQuestion.startsWith('what are') ||
        lowerQuestion.includes('meaning of') ||
        lowerQuestion.includes('definition of') ||
        lowerQuestion.includes('describe what') ||
        /what (does|do) .* mean/.test(lowerQuestion)) {
        return 'definition';
    }
   
    // Explanations
    if (lowerQuestion.startsWith('how does') ||
        lowerQuestion.startsWith('how do') ||
        lowerQuestion.startsWith('why does') ||
        lowerQuestion.startsWith('why do') ||
        lowerQuestion.startsWith('explain') ||
        lowerQuestion.includes('how come') ||
        lowerQuestion.includes('reason for') ||
        lowerQuestion.includes('reasons why') ||
        lowerQuestion.includes('elaborate on') ||
        lowerQuestion.includes('clarify why') ||
        lowerQuestion.includes('help me understand')) {
        return 'explanation';
    }
   
    // Examples
    if (lowerQuestion.includes('example') ||
        lowerQuestion.includes('instance') ||
        lowerQuestion.includes('illustration') ||
        lowerQuestion.startsWith('show me') ||
        lowerQuestion.includes('such as') ||
        lowerQuestion.includes('give me a case of') ||
        lowerQuestion.includes('demonstrate') ||
        lowerQuestion.includes('provide a sample')) {
        return 'example';
    }
   
    // Comparisons
    if (lowerQuestion.includes('difference between') ||
        lowerQuestion.includes('compare') ||
        lowerQuestion.includes('versus') ||
        lowerQuestion.includes(' vs ') ||
        lowerQuestion.includes('contrast') ||
        lowerQuestion.includes('distinguish') ||
        lowerQuestion.includes('similarities') ||
        lowerQuestion.includes('differences') ||
        lowerQuestion.includes('how does') && lowerQuestion.includes('differ from')) {
        return 'comparison';
    }
   
    // Problem solving
    if (lowerQuestion.includes('solve') ||
        lowerQuestion.includes('calculate') ||
        lowerQuestion.includes('find the value') ||
        lowerQuestion.includes('compute') ||
        lowerQuestion.includes('determine the') ||
        /find ([a-z]+) when/.test(lowerQuestion) ||
        lowerQuestion.includes('evaluate') ||
        lowerQuestion.includes('simplify') ||
        lowerQuestion.includes('work out') ||
        /what is \d+\s*[\+\-\*\/]\s*\d+/.test(lowerQuestion)) {
        return 'problem';
    }
   
    // Application questions (new type)
    if (lowerQuestion.includes('how can i use') ||
        lowerQuestion.includes('application of') ||
        lowerQuestion.includes('real-world example') ||
        lowerQuestion.includes('practical use') ||
        lowerQuestion.includes('how is this used') ||
        lowerQuestion.includes('relevance of') ||
        lowerQuestion.includes('importance of')) {
        return 'application';
    }
   
    // Analysis questions (new type)
    if (lowerQuestion.includes('analyze') ||
        lowerQuestion.includes('examine') ||
        lowerQuestion.includes('interpret') ||
        lowerQuestion.includes('implications of') ||
        lowerQuestion.includes('consequences of') ||
        lowerQuestion.includes('discuss the') ||
        lowerQuestion.includes('critical analysis')) {
        return 'analysis';
    }
   
    return 'general';
}

// 3. ENHANCED SENTIMENT ANALYSIS
function detectSentiment(question) {
    const lowerQuestion = question.toLowerCase();
   
    // Detect excitement/enthusiasm
    const excitementIndicators = [
        'amazing', 'wow', 'awesome', 'great', 'excellent', 'fantastic',
        'fascinating', 'interesting', 'cool', 'love', 'incredible',
        'brilliant', 'wonderful', 'exciting', 'impressive', 'thanks'
    ];
   
    // Detect frustration
    const frustrationIndicators = [
        'not working', 'doesn\'t work', 'frustrated', 'annoying', 'annoyed',
        'stupid', 'useless', 'waste of time', 'terrible', 'horrible',
        'awful', 'bad', 'worst', 'ridiculous', 'i give up', 'not helpful',
        'wrong', 'incorrect', 'mistake', 'error', 'not right', 'fail',
        'disappointed', 'this is not', 'that\'s not what'
    ];
   
    // Detect confusion
    const confusionIndicators = [
        'confused', 'don\'t understand', 'do not understand', 'unclear',
        'what do you mean', 'makes no sense', 'confusing', 'lost',
        'clarify', 'explain again', 'still don\'t get it', 'complex',
        'complicated', 'difficult to follow', 'help me understand',
        'i\'m not sure', 'puzzled', 'can you explain', 'doesn\'t make sense'
    ];
   
    // Check for indicators
    if (excitementIndicators.some(indicator => lowerQuestion.includes(indicator))) {
        return 'excited';
    }
   
    if (frustrationIndicators.some(indicator => lowerQuestion.includes(indicator))) {
        return 'frustrated';
    }
   
    if (confusionIndicators.some(indicator => lowerQuestion.includes(indicator))) {
        return 'confused';
    }
   
    return 'neutral';
}

// NEW: 4. CONTEXT TRACKER - To maintain conversation context
const conversationContexts = new Map();

// Initialize or update context for a user
function updateConversationContext(userId, question, response, category) {
    if (!conversationContexts.has(userId)) {
        // Initialize new context
        conversationContexts.set(userId, {
            recentQuestions: [],
            recentCategories: [],
            recentResponses: [],
            followUpQuestions: []
        });
    }
    
    const context = conversationContexts.get(userId);
    
    // Add current question/response to history (limit to last 5)
    context.recentQuestions.unshift(question);
    context.recentCategories.unshift(category);
    context.recentResponses.unshift(response);
    
    // Keep only the last 5 exchanges
    if (context.recentQuestions.length > 5) {
        context.recentQuestions.pop();
        context.recentCategories.pop();
        context.recentResponses.pop();
    }
    
    // Save updated context
    conversationContexts.set(userId, context);
}

// Get context for a user
function getConversationContext(userId) {
    return conversationContexts.get(userId) || {
        recentQuestions: [],
        recentCategories: [],
        recentResponses: [],
        followUpQuestions: []
    };
}

// Function to detect if question is a follow-up to previous conversation
function isFollowUpQuestion(userId, question) {
    const context = getConversationContext(userId);
    if (context.recentQuestions.length === 0) return false;
    
    const lowerQuestion = question.toLowerCase();
    
    // Check for pronouns referring to previous content
    const followUpIndicators = [
        'it', 'this', 'that', 'they', 'them', 'these', 'those',
        'he', 'she', 'his', 'her', 'its', 'their',
        'why', 'how', 'when', 'what about', 'tell me more'
    ];
    
    // Check if question starts with follow-up indicators
    for (const indicator of followUpIndicators) {
        if (lowerQuestion.startsWith(indicator + ' ') || 
            lowerQuestion.startsWith('and ' + indicator + ' ') ||
            lowerQuestion.startsWith('so ' + indicator + ' ') ||
            lowerQuestion.startsWith('but ' + indicator + ' ')) {
            return true;
        }
    }
    
    // Check if question is very short (likely a follow-up)
    if (question.split(' ').length <= 4 && context.recentQuestions.length > 0) {
        return true;
    }
    
    return false;
}

// NEW: 5. FOLLOW-UP QUESTION GENERATOR
function generateFollowUpQuestions(category, questionType, responseText) {
    const followUps = [];
    
    // Generic follow-ups based on question type
    const typeBasedFollowUps = {
        definition: [
            "Can you give me an example of this?",
            "How is this applied in real life?",
            "What's the origin of this concept?",
            "How does this relate to other similar concepts?"
        ],
        explanation: [
            "Can you explain this in simpler terms?",
            "What are some real-world applications of this?",
            "Are there any exceptions to this explanation?",
            "How has our understanding of this changed over time?"
        ],
        example: [
            "Can you provide a more complex example?",
            "What principles does this example demonstrate?",
            "How would this example change in a different context?",
            "What's a counterexample to this?"
        ],
        comparison: [
            "Which one is more commonly used and why?",
            "Are there situations where one is clearly better than the other?",
            "How have these differences evolved over time?",
            "Can you give examples where these differences are significant?"
        ],
        problem: [
            "Can you explain another approach to solve this?",
            "What's a more challenging problem like this?",
            "How would we apply this method to a different problem?",
            "What common mistakes do people make with this kind of problem?"
        ],
        application: [
            "What are some limitations of this application?",
            "How might this be used in the future?",
            "Can you explain a specific case where this was applied successfully?",
            "What skills are needed to apply this effectively?"
        ],
        analysis: [
            "What are alternative interpretations?",
            "How does this analysis compare to other perspectives?",
            "What evidence supports this analysis?",
            "What are the implications of this analysis?"
        ],
        general: [
            "Can you tell me more about this topic?",
            "How does this relate to current developments in the field?",
            "What's something surprising about this that most people don't know?",
            "What resources would you recommend to learn more about this?"
        ]
    };
    
    // Subject-specific follow-ups
    const subjectBasedFollowUps = {
        math: [
            "Can you show me how to solve a more challenging problem like this?",
            "How is this mathematical concept applied in the real world?",
            "What other mathematical concepts are related to this?",
            "What's the history behind this mathematical concept?"
        ],
        science: [
            "How has our understanding of this scientific concept evolved?",
            "What experiments demonstrated this scientific principle?",
            "How does this relate to other areas of science?",
            "What are the current research frontiers in this area?"
        ],
        history: [
            "How did this historical event influence later developments?",
            "What were the perspectives of different groups during this time?",
            "How do historians interpret the significance of this event?",
            "How might things be different if this historical event had not occurred?"
        ],
        general: [
            "Can you explain this from a different perspective?",
            "How does this topic connect to contemporary issues?",
            "What are some common misconceptions about this?",
            "Who are the key figures or experts in this field?"
        ]
    };
    
    // Add 2 type-based follow-ups
    const typeFollowUps = typeBasedFollowUps[questionType] || typeBasedFollowUps.general;
    followUps.push(...typeFollowUps.slice(0, 2));
    
    // Add 2 subject-based follow-ups
    const subjectFollowUps = subjectBasedFollowUps[category] || subjectBasedFollowUps.general;
    followUps.push(...subjectFollowUps.slice(0, 2));
    
    // Shuffle and return 3 unique questions
    return [...new Set(followUps)]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
}

// Enhanced function to get response from Hugging Face API with context awareness
async function generateResponse(question, userId = 'anonymous') {
    // Define categories based on content
    const lowerQuestion = question.toLowerCase();
   
    // Detect subject category from question
    let category = detectSubject(question);
   
    // Detect question type (definition, explanation, example)
    const questionType = detectQuestionType(question);
   
    // Detect user sentiment
    const sentiment = detectSentiment(question);
    
    // Get conversation context
    const context = getConversationContext(userId);
    
    // Check if this is a follow-up question
    const isFollowUp = isFollowUpQuestion(userId, question);

    // Check for direct matches to provide immediate responses without API call
    const directResponse = getDirectResponse(lowerQuestion);
    if (directResponse) {
        // Generate follow-up questions
        const followUpQuestions = generateFollowUpQuestions(category, questionType, directResponse);
        
        // Update context with this exchange
        updateConversationContext(userId, question, directResponse, category);
        
        // Save follow-up questions in context
        context.followUpQuestions = followUpQuestions;
        conversationContexts.set(userId, context);
        
        return {
            category,
            questionType,
            sentiment,
            response: directResponse,
            followUpQuestions,
            isFollowUp
        };
    }

    // For other questions, try the API with a strict timeout
    try {
        // 4. ENHANCED AI COMPONENT - Using a more capable model when available
        const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

        // Format the question based on category, question type, and context
        let input = formatPrompt(question, category, questionType, isFollowUp ? context : null);

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
            const fallbackResponse = getDetailedResponse(category, questionType, question, sentiment, 
                                                       isFollowUp ? context : null);
            
            // Generate follow-up questions
            const followUpQuestions = generateFollowUpQuestions(category, questionType, fallbackResponse);
            
            // Update context with this exchange
            updateConversationContext(userId, question, fallbackResponse, category);
            
            // Save follow-up questions in context
            context.followUpQuestions = followUpQuestions;
            conversationContexts.set(userId, context);
            
            return {
                category,
                questionType,
                sentiment,
                response: fallbackResponse,
                followUpQuestions,
                isFollowUp
            };
        }

        const result = await response.json();

        // Check if we got a valid response from the API
        if (result && result[0] && result[0].generated_text) {
            // Add sentiment-based and context-aware adjustments
            let finalResponse = result[0].generated_text;
            
            // Add sentiment response
            if (sentiment !== 'neutral') {
                finalResponse = addSentimentResponse(finalResponse, sentiment);
            }
            
            // Add context if this is a follow-up question
            if (isFollowUp && context.recentQuestions.length > 0) {
                finalResponse = addContextPrefix(finalResponse, context.recentQuestions[0], question);
            }
            
            // Generate follow-up questions
            const followUpQuestions = generateFollowUpQuestions(category, questionType, finalResponse);
            
            // Update context with this exchange
            updateConversationContext(userId, question, finalResponse, category);
            
            // Save follow-up questions in context
            context.followUpQuestions = followUpQuestions;
            conversationContexts.set(userId, context);
            
            return {
                category,
                questionType,
                sentiment,
                response: finalResponse,
                followUpQuestions,
                isFollowUp
            };
        } else {
            // Use our fallback if the response format wasn't as expected
            const fallbackResponse = getDetailedResponse(category, questionType, question, sentiment, 
                                                       isFollowUp ? context : null);
            
            // Generate follow-up questions
            const followUpQuestions = generateFollowUpQuestions(category, questionType, fallbackResponse);
            
            // Update context with this exchange
            updateConversationContext(userId, question, fallbackResponse, category);
            
            // Save follow-up questions in context
            context.followUpQuestions = followUpQuestions;
            conversationContexts.set(userId, context);
            
            return {
                category,
                questionType,
                sentiment,
                response: fallbackResponse,
                followUpQuestions,
                isFollowUp
            };
        }
    } catch (error) {
        console.error("Error calling Hugging Face API:", error);

        // Return a fallback response
        const fallbackResponse = getDetailedResponse(category, questionType, question, sentiment, 
                                                   isFollowUp ? context : null);
        
        // Generate follow-up questions
        const followUpQuestions = generateFollowUpQuestions(category, questionType, fallbackResponse);
        
        // Update context with this exchange
        updateConversationContext(userId, question, fallbackResponse, category);
        
        // Save follow-up questions in context
        context.followUpQuestions = followUpQuestions;
        conversationContexts.set(userId, context);
        
        return {
            category,
            questionType,
            sentiment,
            response: fallbackResponse,
            followUpQuestions,
            isFollowUp
        };
    }
}

// Add context-aware prefix to response for follow-up questions
function addContextPrefix(response, previousQuestion, currentQuestion) {
    // If the current question is very short or uses pronouns without context
    if (currentQuestion.split(' ').length <= 4 || /^(it|this|that|they|them|these|those)\b/i.test(currentQuestion)) {
        return `Regarding your question about "${previousQuestion}": ${response}`;
    }
    return response;
}

// Enhanced helper function to format the prompt based on question type, category, and context
function formatPrompt(question, category, questionType, context = null) {
    let prompt = question;
   
    // Add context from previous exchanges if available
    if (context && context.recentQuestions.length > 0) {
        const previousQuestion = context.recentQuestions[0];
        const previousCategory = context.recentCategories[0];
        
        // For follow-up questions, provide previous context
        prompt = `Previous question: "${previousQuestion}" 
Current question: "${question}"
Provide a detailed response to the current question in the context of the previous question.`;
    }
    
    // Format based on question type
    if (questionType === 'definition') {
        prompt = `Define the following term in comprehensive detail: ${prompt}`;
    } else if (questionType === 'explanation') {
        prompt = `Explain thoroughly how this works with clear steps: ${prompt}`;
    } else if (questionType === 'example') {
        prompt = `Provide several specific, varied, and illuminating examples for: ${prompt}`;
    } else if (questionType === 'comparison') {
        prompt = `Compare and contrast in thorough detail, addressing similarities, differences, and applications: ${prompt}`;
    } else if (questionType === 'problem') {
        prompt = `Solve this problem step-by-step with clear explanations for each step: ${prompt}`;
    } else if (questionType === 'application') {
        prompt = `Explain practical applications and real-world relevance of: ${prompt}`;
    } else if (questionType === 'analysis') {
        prompt = `Provide a detailed analysis with multiple perspectives on: ${prompt}`;
    }
   
    // Add category context with more detailed instructions
    if (category === 'math') {
        prompt = `${prompt}. Provide a precise mathematical explanation with appropriate formulas, definitions, and principles. If applicable, include step-by-step solutions and visual representations.`;
    } else if (category === 'science') {
        prompt = `${prompt}. Answer with scientific accuracy, referencing relevant theories, experimental evidence, and current scientific understanding. Include appropriate scientific terminology and relationships between concepts.`;
    } else if (category === 'history') {
        prompt = `${prompt}. Include relevant historical context, timeline of events, key figures, causes and effects, and different historical perspectives. Address the significance and lasting impact where appropriate.`;
    }
   
    return prompt;
}

// Enhanced subject detection with expanded keywords and pattern recognition
function detectSubject(question) {
    const lowerQuestion = question.toLowerCase();
   
    // Check for math equations and patterns
    if (/[+\-*\/=]/.test(lowerQuestion) || 
        /\d+/.test(lowerQuestion) ||
        /calculate|formula|equation|solve for|find the value|graph of|function/i.test(lowerQuestion)) {
        return 'math';
    }
    
    // Enhanced pattern recognition for science questions
    if (/molecule|chemical reaction|atom|cell|biology|physics|experiment|theory of|law of|scientific|element|compound/i.test(lowerQuestion)) {
        return 'science';
    }
    
    // Enhanced pattern recognition for history questions
    if (/century|ancient|war|revolution|empire|king|queen|president|civiliz|archaeolog|historical|dynasty|colonial|independence|treaty/i.test(lowerQuestion)) {
        return 'history';
    }
   
    // Check each subject's keywords with weighing system
    let scores = { math: 0, science: 0, history: 0 };
    
    // Count keywords for each subject
    for (const [subject, keywords] of Object.entries(subjects)) {
        for (const keyword of keywords) {
            if (lowerQuestion.includes(keyword)) {
                scores[subject] += 1;
            }
        }
    }
    
    // Find subject with highest score
    let maxScore = 0;
    let detectedSubject = 'general';
    
    for (const [subject, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedSubject = subject;
        }
    }
    
    return detectedSubject;
}

// Enhanced sentiment response with more natural language
function addSentimentResponse(response, sentiment) {
    if (sentiment === 'frustrated') {
        const frustrationResponses = [
            `I understand this might be frustrating. Let me clarify: ${response}`,
            `I sense your frustration. Here's a clearer explanation: ${response}`,
            `I appreciate your patience. Let me try a better approach: ${response}`,
            `I'm sorry this is challenging. Let me explain differently: ${response}`
        ];
        return frustrationResponses[Math.floor(Math.random() * frustrationResponses.length)];
    } else if (sentiment === 'confused') {
        const confusionResponses = [
            `I see you might be a bit confused. Let me explain more clearly: ${response}`,
            `Let me break this down more simply: ${response}`,
            `This can be tricky to understand. Here's a clearer explanation: ${response}`,
            `Let me simplify this concept: ${response}`
        ];
        return confusionResponses[Math.floor(Math.random() * confusionResponses.length)];
    } else if (sentiment === 'excited') {
        const excitedResponses = [
            `I'm glad you're interested in this! ${response}`,
            `Your enthusiasm is great! Here's what you want to know: ${response}`,
            `It's exciting to explore this topic! ${response}`,
            `I love your interest in learning! ${response}`
        ];
        return excitedResponses[Math.floor(Math.random() * excitedResponses.length)];
    }
    return response;
}

// Direct responses for common questions - EXPANDED with more comprehensive answers
function getDirectResponse(question) {
    const directResponses = {
        // Math responses
        'what is 1+1': "The answer to 1+1 is 2. This is a fundamental addition operation in mathematics where we combine the value 1 with another value 1 to get 2.",
        '1+1': "The answer to 1+1 is 2. In mathematical terms, this represents the sum of two units, which equals two units.",
        'what is the pythagorean theorem': "The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. It is expressed as a² + b² = c², where c is the length of the hypotenuse and a and b are the lengths of the other two sides. This theorem is fundamental to trigonometry and has numerous applications in construction, navigation, physics, and other fields.",
        'what is pi': "Pi (π) is a mathematical constant defined as the ratio of a circle's circumference to its diameter. It's approximately equal to 3.14159, though it's an irrational number with an infinite, non-repeating decimal representation. Pi appears in many formulas across mathematics and physics, especially those involving circles, spheres, and other curved shapes. It's also found in unexpected areas like number theory, statistics, and even the natural world in river meandering patterns and the spiral structure of DNA.",
        'what is calculus': "Calculus is a branch of mathematics that studies continuous change and motion. It has two main branches: differential calculus (concerning rates of change and slopes of curves) and integral calculus (concerning accumulation of quantities and the areas under curves). Calculus provides powerful tools for modeling systems with changing quantities in science, engineering, economics, and many other fields. It was independently developed by Isaac Newton and Gottfried Wilhelm Leibniz in the late 17th century and has become fundamental to modern scientific understanding of the world.",
       
        // Science responses
        'what is evaporation': "Evaporation is the process where liquid water changes into water vapor (gas). This happens when water molecules gain enough energy from heat to break free from the liquid's surface. Evaporation occurs at temperatures below water's boiling point and is a key part of the water cycle. It happens all around us - from wet clothes drying to puddles disappearing after rain. Factors affecting evaporation rate include temperature, humidity, wind speed, and surface area. Unlike boiling, evaporation only occurs at the surface of a liquid rather than throughout the entire volume.",
        'what is science': "Science is the systematic study of the natural world through observation, experimentation, and the formulation and testing of hypotheses. It aims to discover patterns and principles that help us understand how things work. The scientific method involves making observations, asking questions, forming hypotheses, conducting experiments, analyzing data, and drawing conclusions. Science encompasses many fields including physics, chemistry, biology, astronomy, geology, and more. It is characterized by its emphasis on empirical evidence, logical reasoning, skepticism, and peer review to validate findings. Science continuously evolves as new discoveries challenge and refine our understanding of the universe.",
        'what is photosynthesis': "Photosynthesis is the process by which green plants, algae, and certain bacteria convert light energy, usually from the sun, into chemical energy in the form of glucose or other sugars. The process primarily takes place in plant leaves within specialized structures called chloroplasts that contain the green pigment chlorophyll. During photosynthesis, plants take in carbon dioxide (CO₂) from the air through small openings called stomata, and water (H₂O) from the soil through their roots. Using sunlight energy, these components are transformed into glucose (C₆H₁₂O₆) and oxygen (O₂). The overall chemical equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This process is essential for life on Earth as it produces oxygen for respiration and serves as the foundation of most food chains.",
        'what is dna': "DNA (Deoxyribonucleic Acid) is a molecule that carries the genetic instructions for the development, functioning, growth, and reproduction of all known organisms. DNA consists of two long strands that form a double helix structure, resembling a twisted ladder. Each strand is made up of nucleotides, which contain a sugar (deoxyribose), a phosphate group, and one of four nitrogen-containing bases: adenine (A), thymine (T), guanine (G), or cytosine (C). The bases pair specifically: A with T and G with C, forming the 'rungs' of the ladder. The sequence of these bases encodes the genetic information. When cells divide, DNA replicates itself so that each new cell has an identical copy. Mutations in DNA can lead to variations that drive evolution but can also cause diseases. DNA was first isolated by Friedrich Miescher in 1869, but its structure wasn't determined until 1953 by James Watson and Francis Crick, with crucial X-ray crystallography work by Rosalind Franklin and Maurice Wilkins.",
        'what is gravity': "Gravity is the natural force by which objects with mass attract one another. On Earth, gravity gives weight to objects and causes them to fall toward the ground when dropped. Isaac Newton's law of universal gravitation describes gravity as a force that acts between any two masses, with strength proportional to the product of the masses and inversely proportional to the square of the distance between them. Einstein's general theory of relativity, developed in the early 20th century, revolutionized our understanding of gravity by explaining it as a curvature of spacetime caused by mass and energy. This theory successfully predicted phenomena like gravitational waves and the bending of light around massive objects. Gravity plays a crucial role in forming stars, planets, and galaxies, and keeps Earth and other planets in orbit around the Sun. Despite being the weakest of the four fundamental forces, gravity dominates on cosmic scales due to its infinite range and inability to be neutralized.",
       
        // History responses
        'what is the capital of the philippines': "The capital of the Philippines is Manila. Located on Luzon Island, it's one of the oldest cities in the country, established in 1571 when Spanish conquistadors arrived. Today, Manila serves as the country's political, economic, educational, and cultural center with a rich history visible in sites like Intramuros (the historic walled city), Rizal Park, and Manila Cathedral. The broader metropolitan area, Metro Manila, includes 16 cities and municipalities including Quezon City, which briefly served as the capital from 1948 to 1976. Manila has been shaped by Spanish colonial rule, American occupation, Japanese invasion during WWII, and various natural disasters throughout its history.",
        'who discovered america': "The question of who discovered America has multiple answers depending on context. Indigenous peoples first arrived thousands of years ago, likely crossing a land bridge from Asia during the last Ice Age (around 15,000-30,000 years ago). These diverse groups developed complex civilizations throughout North and South America. Viking explorer Leif Erikson reached North America around 1000 CE, establishing a short-lived settlement at L'Anse aux Meadows in Newfoundland, Canada. In 1492, Christopher Columbus's voyage initiated sustained European contact with the Americas, though he believed he had reached Asia. This led to subsequent Spanish colonization and the broader 'Columbian Exchange' of people, plants, animals, and diseases between hemispheres. Each represents a 'discovery' from different perspectives. It's important to note that using the term 'discovery' is problematic as it minimizes the presence and achievements of indigenous populations who had inhabited and developed civilizations in the Americas for millennia before European arrival.",
        'what is the french revolution': "The French Revolution (1789-1799) was a period of radical social and political upheaval in France that fundamentally transformed the country's governmental structure from an absolute monarchy to a republic based on the principles of liberty, equality, and fraternity. Triggered by financial crisis, social inequalities, and Enlightenment ideals, it began with the Storming of the Bastille on July 14, 1789. Key events included the Declaration of the Rights of Man and of the Citizen, the women's march on Versailles, the abolition of feudalism, and the execution of King Louis XVI in 1793. The Revolution entered its most radical phase with the Reign of Terror (1793-1794) under Maximilien Robespierre and the Committee of Public Safety, when thousands were executed by guillotine. The Revolution eventually gave way to the Directory and then Napoleon Bonaparte's rise to power. Its legacy is profound, inspiring revolutionary movements worldwide and establishing ideals of republican government, secularism, nationalism, and citizen rights that continue to influence modern politics and society.",
        'what caused world war 2': "World War II (1939-1945) was caused by multiple interconnected factors: 1) The harsh terms of the Treaty of Versailles following World War I, which humiliated Germany, imposed severe economic penalties, and created resentment and economic hardship; 2) The Great Depression (1929-1939), which intensified economic nationalism, trade protectionism, and created conditions for extremist political movements to gain support; 3) The rise of fascism and militaristic nationalism, particularly Nazi Germany under Adolf Hitler, with aggressive expansionist policies based on racial ideology and the concept of 'living space' (Lebensraum); 4) The failure of appeasement policies by Western powers, who hoped to avoid war by making concessions to Hitler, exemplified by the Munich Agreement of 1938; 5) Japan's militaristic expansion in Asia, driven by imperial ambitions and resource needs; and 6) The collapse of international cooperation through the ineffective League of Nations. The war officially began in Europe when Germany invaded Poland on September 1, 1939, prompting Britain and France to declare war. It expanded into a truly global conflict after Japan's attack on Pearl Harbor in December 1941 and Hitler's declaration of war against the United States days later.",
        'who was julius caesar': "Julius Caesar (100-44 BCE) was a Roman general, statesman, and consul who played a critical role in the events that led to the demise of the Roman Republic and the rise of the Roman Empire. Born into a patrician family, Caesar rose to prominence through military achievements, particularly his conquest of Gaul (modern France and Belgium) between 58-50 BCE, which he documented in his famous 'Commentaries on the Gallic War.' His military success and popularity with the people threatened the Senate's authority. After crossing the Rubicon River with his army in 49 BCE (famously declaring 'the die is cast'), he defeated his rival Pompey in a civil war and became dictator of Rome. As dictator, Caesar implemented numerous reforms: he restructured debt laws, reformed the calendar to the Julian calendar (basis for our modern calendar), expanded the Senate, and granted citizenship to many provincials. His centralization of power alarmed many senators who feared he would declare himself king. This led to his assassination on March 15 (the Ides of March), 44 BCE, when he was stabbed 23 times by a group of senators led by Marcus Junius Brutus and Gaius Cassius Longinus. His death sparked another civil war that ended the Roman Republic. His grandnephew and adopted heir Octavian (later Augustus) became the first Roman Emperor, fulfilling Caesar's legacy of transforming Rome from republic to empire."
    };
   
    return directResponses[question.toLowerCase()];
}

// Enhanced detailed fallback responses when the API call fails
function getDetailedResponse(category, questionType, question, sentiment, context = null) {
    // First check for direct match responses
    const directResponse = getDirectResponse(question.toLowerCase());
    if (directResponse) return directResponse;
    
    // Add context awareness if this is a follow-up question
    let contextPrefix = "";
    if (context && context.recentQuestions.length > 0) {
        // Extract key subject from previous question to frame the response
        contextPrefix = `Based on our discussion about ${context.recentQuestions[0]}, `;
    }
   
    // Category-specific responses
    const categoryResponses = {
        science: {
            definition: `${contextPrefix}In science, definitions are precise statements that explain the meaning of terms. This scientific concept refers to observable phenomena that can be studied through the scientific method, which includes forming hypotheses, conducting experiments, and analyzing data. Scientists use careful observations, empirical evidence, and peer review to refine and validate these concepts over time. Precision in scientific definitions is crucial for effective communication between researchers and ensuring reproducible results.`,
            explanation: `${contextPrefix}Scientific explanations describe how natural processes work based on evidence and established theories. This process involves several interrelated steps and follows fundamental principles of cause and effect. Scientific explanations aim to provide mechanisms that connect observations to underlying principles. A good scientific explanation makes testable predictions, is consistent with existing knowledge, and can be modified as new evidence emerges. The explanation for this phenomenon has been developed through decades of research and experimentation.`,
            example: `${contextPrefix}Here are some examples that illustrate this scientific concept: 1) Water freezing at 0°C demonstrates how temperature affects molecular motion and phase changes in matter, 2) Photosynthesis in plants showcases energy conversion from light to chemical energy, illustrating conservation of energy principles, 3) Gravity causing objects to fall demonstrates fundamental forces, with acceleration proportional to mass, 4) DNA replication during cell division exemplifies biological information transfer and the molecular basis of inheritance.`,
            comparison: `${contextPrefix}When comparing these scientific concepts, we need to examine their underlying mechanisms, applications in different contexts, and relationships to established theories. While they share some fundamental principles such as conservation laws or feedback mechanisms, they differ in important ways. The first involves immediate energy transfers, while the second involves multi-step processes with intermediate stages. Different scientific models often emerge from studying phenomena at different scales or under different conditions, providing complementary rather than contradictory explanations.`,
            problem: `${contextPrefix}To solve this science problem, we need to apply specific scientific principles and formulas systematically. First, we should identify the key variables and their relationships. Next, we apply the relevant scientific laws or equations that govern these relationships. Then, we perform calculations or analyses to find the solution, always keeping units consistent. Finally, we verify that our answer is reasonable by checking its magnitude, units, and consistency with physical constraints.`,
            application: `${contextPrefix}This scientific concept has numerous practical applications in our daily lives and in technology. In medicine, it helps in diagnosing and treating diseases by understanding underlying biological mechanisms. In engineering, it enables the design of more efficient systems and materials with specific properties. In environmental science, it allows us to predict and mitigate human impacts on natural systems. Recent advances have expanded applications to include cutting-edge technologies like artificial intelligence, renewable energy systems, and personalized medicine.`,
            analysis: `${contextPrefix}Analyzing this scientific phenomenon requires considering multiple perspectives and lines of evidence. Current research indicates several possible mechanisms, with the most supported explanation involving the interaction between different systems and feedback loops. Alternative hypotheses exist but have less empirical support. Key evidence comes from experimental studies showing statistical correlations between variables and mechanistic studies that demonstrate causal pathways. The implications of this analysis extend to related fields and raise important questions for future research.`,
            general: `${contextPrefix}This is an interesting scientific question that touches on fundamental principles in science. Science helps us understand the natural world through systematic observation, experimentation, and theory building. This specific topic connects to broader scientific concepts like energy transformations, systems thinking, and equilibrium states. Recent research has expanded our understanding of this area, though some aspects remain active areas of investigation. Scientists approach this question using methods specific to their field, whether through controlled experiments, observational studies, or theoretical modeling.`
        },
        math: {
            definition: `${contextPrefix}In mathematics, definitions are precise statements that establish the meaning of mathematical objects, concepts, or symbols. This mathematical concept has specific properties that distinguish it from related concepts. Mathematical definitions are characterized by their precision, allowing mathematicians to build logical structures without ambiguity. Unlike in everyday language, mathematical terms have exact meanings that remain consistent across different contexts. This allows for the development of proofs and theorems that extend our understanding of mathematical relationships.`,
            explanation: `${contextPrefix}Mathematical explanations involve logical reasoning and proofs based on axioms and previously established theorems. This process follows step-by-step logic that shows how mathematical truths are derived from fundamental principles. Each step in a mathematical explanation must follow directly from previous steps using valid logical operations. The beauty of mathematical explanations lies in their universality - once proven, they remain true regardless of time, place, or cultural context. This particular mathematical concept connects to several important areas of mathematics, serving as a bridge between seemingly unrelated fields.`,
            example: `${contextPrefix}Here are illustrative mathematical examples: 1) The equation x² + 1 = 0 has two complex solutions: i and -i, demonstrating how complex numbers extend the real number system, 2) The Fibonacci sequence (1,1,2,3,5,8...) shows recursive patterns where each number is the sum of the two preceding ones, with fascinating connections to the golden ratio, 3) A right triangle with sides 3, 4, and 5 satisfies the Pythagorean theorem (3² + 4² = 5²), providing a perfect integer solution, 4) The function f(x) = e^x has the unique property that it equals its own derivative, illustrating a fundamental concept in calculus.`,
            comparison: `${contextPrefix}When comparing these mathematical concepts, we examine their definitions, properties, domains of application, and relationships to other mathematical structures. The first concept operates in discrete space while the second applies to continuous domains. They differ in which axioms and theorems they build upon, though both ultimately connect to foundational mathematical principles. One offers a more generalized approach applicable across multiple fields, while the other provides specialized tools for specific types of problems. Understanding their similarities and differences illuminates the elegant interconnectedness of mathematical ideas.`,
            problem: `${contextPrefix}To solve this math problem, I'll break it down into steps: 1) Identify what we're looking for and what information we're given, 2) Select appropriate mathematical techniques or formulas that relate the known and unknown quantities, 3) Apply algebraic operations systematically to isolate the variable or find the solution, 4) Check our work by substituting the answer back into the original problem to verify it satisfies all conditions. This methodical approach works for most mathematical problems, though complex problems might require combining multiple concepts or techniques.`,
            application: `${contextPrefix}This mathematical concept has wide-ranging applications across numerous fields. In physics, it helps model natural phenomena and predict outcomes of experiments. In computer science, it forms the basis for algorithms and data structures that power modern technology. In economics, it allows for modeling complex market behaviors and optimization problems. In engineering, it enables precise design calculations and system analysis. Even in art and music, its patterns and proportions can be found in compositions that humans find aesthetically pleasing. Recent applications extend to machine learning, cryptography, and complex systems analysis.`,
            analysis: `${contextPrefix}Analyzing this mathematical concept requires examining its properties, structure, and connections to other areas of mathematics. It belongs to a broader class of mathematical objects with similar characteristics but important distinctions. Its behavior under different operations reveals symmetries and invariants that characterize its structure. From a historical perspective, this concept evolved from simpler ideas and has been generalized and extended by numerous mathematicians. Open questions still exist about some of its properties in extreme or boundary cases, making it an active area of mathematical research.`,
            general: `${contextPrefix}Mathematics involves the study of numbers, quantities, shapes, patterns, and logical relationships. To approach this question, we need to apply logical reasoning and specific mathematical techniques relevant to the topic. Mathematics provides powerful tools for describing and understanding the world, from everyday calculations to the most abstract theoretical concepts. This particular question touches on principles that connect different branches of mathematics, showing how mathematical ideas form an interconnected web of knowledge. Whether you're interested in practical applications or theoretical insights, this mathematical topic offers rich possibilities for exploration.`
        },
        history: {
            definition: `${contextPrefix}In historical studies, definitions help establish the scope and significance of historical events, periods, or concepts. This historical concept developed within specific social, political, and cultural contexts that shaped its meaning and importance. Unlike scientific definitions, historical concepts often evolve over time as new evidence emerges and interpretations change. Understanding this concept requires considering how contemporaries viewed it as well as how subsequent historians have interpreted it. The definition also varies across different historical traditions and schools of thought, reflecting the complex nature of historical understanding.`,
            explanation: `${contextPrefix}Historical explanations examine the causes, effects, and significance of events within their broader context. This historical process involved multiple factors including social dynamics, economic conditions, political structures, cultural influences, and individual actions that collectively shaped how events unfolded. Historians debate which factors were most influential, with some emphasizing structural conditions while others highlight human agency and contingency. Primary sources from the period provide evidence for different interpretations, though these sources must be critically evaluated for bias and reliability. The full explanation requires understanding both immediate triggers and longer-term underlying conditions that created the historical context.`,
            example: `${contextPrefix}Historical examples include: 1) The American Revolution (1775-1783) established independence from British rule and introduced republican government based on Enlightenment principles, transforming global political thought, 2) The Industrial Revolution (18th-19th centuries) fundamentally changed manufacturing, transportation, and social structures through technological innovation, creating modern economic systems, 3) The Renaissance period (14th-17th centuries) saw renewed interest in classical learning and arts in Europe, laying groundwork for scientific revolution and modern thought, 4) The Silk Road trade networks connected civilizations across Asia, Europe, and Africa for centuries, facilitating exchange of goods, technologies, and ideas that shaped world history.`,
            comparison: `${contextPrefix}When comparing these historical developments, historians consider multiple dimensions: their causes, implementation, key figures, impacts, and legacies. The first emerged from grassroots movements and emphasized social transformation, while the second was directed more by elites focused on political restructuring. Both reflected the intellectual currents of their respective eras but adapted those ideas to local conditions and traditions. Their lasting impacts differed significantly in scope and nature, with one primarily affecting institutional structures while the other transformed everyday life and cultural practices. These differences reflect the complex interplay of local conditions with broader historical trends.`,
            problem: `${contextPrefix}To address this historical question, we need to consider multiple perspectives and examine diverse sources of evidence. Primary sources such as letters, journals, official documents, and artifacts provide firsthand accounts but must be evaluated in context. Secondary sources offer interpretations by historians that have evolved over time as new evidence emerges and analytical frameworks change. We should consider how different historical actors experienced and understood events differently based on their social position, culture, and interests. A comprehensive answer acknowledges the limitations of historical knowledge while presenting the most supported explanations based on available evidence.`,
            application: `${contextPrefix}Understanding this historical development has relevant applications for contemporary issues and decision-making. It provides precedents and analogies that can inform current policies, though historical comparisons must always account for different contexts. Examining how past societies addressed similar challenges offers insights into potential solutions and pitfalls. The historical legacy of these events continues to shape modern institutions, cultural attitudes, and social structures in ways that affect everyday life. Historical awareness also helps us recognize patterns and cycles that might otherwise go unnoticed in current events, providing perspective on present-day developments.`,
            analysis: `${contextPrefix}Analysis of this historical topic reveals complex interactions between different factors and forces. Economic considerations created underlying conditions that made change possible, while political leadership and social movements determined the specific direction and pace of developments. Cultural and intellectual frameworks provided justifications and shaped how participants understood their actions. Regional variations demonstrate how local conditions modified broader patterns, creating distinct manifestations of similar processes. Recent historiography has expanded beyond traditional political narratives to incorporate perspectives from previously marginalized groups, enriching our understanding of this historical phenomenon.`,
            general: `${contextPrefix}This is an interesting historical question that connects to broader patterns in human experience. History helps us understand past events and their significance through the critical examination of evidence and the development of interpretations that evolve over time. This specific topic represents an important turning point that continues to influence contemporary society and thought. Historians approach this question by examining primary sources, considering multiple perspectives, and placing events in their proper context. While historical knowledge is always incomplete and subject to revision, careful research provides valuable insights into how and why events unfolded as they did.`
        },
        general: {
            definition: `${contextPrefix}Definitions establish the meaning and scope of concepts by identifying their essential characteristics. This concept refers to specific ideas or phenomena that can be understood through their properties, functions, and relationships to other concepts. A good definition clarifies boundaries and distinguishes the concept from related ideas, while remaining flexible enough to accommodate variations and exceptions. Definitions can vary across different fields and contexts, reflecting the complex nature of knowledge and the specific needs of different disciplines. Understanding this definition provides a foundation for deeper exploration of the topic.`,
            explanation: `${contextPrefix}Explanations describe how things work or why they occur by identifying causal relationships and underlying principles. This process involves several interconnected factors that contribute to the observed outcomes or phenomena. A comprehensive explanation addresses both immediate mechanisms and broader contextual factors that enable these mechanisms to operate. Alternative explanations exist, but the one presented here has the strongest supporting evidence and theoretical foundation. Understanding this explanation helps connect this topic to wider principles and patterns that apply across multiple domains and situations.`,
            example: `${contextPrefix}Here are illuminating examples that demonstrate different aspects of this concept: 1) In educational settings, this approach has been implemented through collaborative learning environments that improve student engagement and knowledge retention, 2) In technology development, applying these principles has led to innovations that address previously unsolved problems by reframing key assumptions, 3) In community organizations, these methods have transformed conflict resolution processes and strengthened social bonds, 4) In personal development contexts, individuals have used these concepts to overcome persistent challenges by developing new perspectives and skills.`,
            comparison: `${contextPrefix}When comparing these approaches or ideas, we consider their foundational assumptions, methodologies, applications, and outcomes. The first approach emphasizes systematic processes and quantifiable results, while the second focuses more on adaptive responses and qualitative improvements. They differ in their historical development, with one emerging from formal institutional contexts and the other from grassroots practice. Both have strengths in particular contexts: the first excels in structured environments with clear parameters, while the second offers advantages in dynamic, complex situations requiring flexibility. Understanding their complementary nature allows for selecting the most appropriate approach for specific circumstances.`,
            problem: `${contextPrefix}To address this question effectively, we need to break it down into its component parts, identify relevant principles and information, and develop a systematic approach. First, we should clarify what specific outcome or understanding we're seeking. Next, we'll examine the factors that influence this situation and how they interact. Then, we'll apply appropriate frameworks or methods to analyze these factors and develop potential solutions. Finally, we'll evaluate these solutions against criteria such as effectiveness, feasibility, and sustainability to determine the optimal approach. This method balances analytical rigor with practical considerations to address the question comprehensively.`,
            application: `${contextPrefix}This concept has wide-ranging applications across different domains and contexts. In professional settings, it provides frameworks for improving organizational processes and decision-making. In personal development, it offers strategies for enhancing learning, creativity, and well-being. In social contexts, it informs approaches to strengthening communities and addressing shared challenges. Recent innovations have expanded applications to include digital environments, cross-cultural contexts, and complex system management. The flexibility of these principles allows them to be adapted to specific circumstances while maintaining their core effectiveness.`,
            analysis: `${contextPrefix}Analyzing this topic requires examining it from multiple perspectives to understand its full complexity. Current research identifies several key dimensions that interact to create observed patterns and outcomes. Different theoretical frameworks offer complementary insights: behavioral approaches highlight observable patterns, cognitive perspectives examine underlying mental processes, and systems theories focus on broader contextual factors and interactions. Evidence supporting this analysis comes from diverse sources including experimental studies, field observations, and comparative case studies. This multifaceted analysis reveals both common principles and important contextual variations that affect how this phenomenon manifests in different situations.`,
            general: `${contextPrefix}This is a fascinating question that touches on fundamental aspects of human experience and knowledge. To give you the most helpful answer, I'll need to draw on insights from multiple fields and perspectives. This topic connects to broader patterns and principles that apply across diverse contexts, though specific manifestations vary based on particular circumstances. Recent developments have expanded our understanding of this area, though some aspects remain open to further exploration and discovery. A comprehensive approach to this question considers both theoretical frameworks and practical applications, balancing general principles with contextual awareness.`
        }
    };
   
    // Get response based on category and question type
    let response = "";
    if (categoryResponses[category] && categoryResponses[category][questionType]) {
        response = categoryResponses[category][questionType];
    } else {
        response = "I don't have specific information about that topic, but I'd be happy to explore it with you. Could you provide a bit more detail about what aspect you're interested in learning about?";
    }
   
    // Add sentiment-based responses
    if (sentiment === 'frustrated') {
        const frustrationResponses = [
            `I understand this might be frustrating. Let me try to help: ${response}`,
            `I sense your frustration. Here's a clearer explanation: ${response}`,
            `I appreciate your patience. Let me try a better approach: ${response}`,
            `I'm sorry this is challenging. Let me explain differently: ${response}`
        ];
        return frustrationResponses[Math.floor(Math.random() * frustrationResponses.length)];
    } else if (sentiment === 'confused') {
        const confusionResponses = [
            `I see you might be looking for clearer information. Let me explain: ${response}`,
            `This concept can be confusing. Here's a more straightforward explanation: ${response}`,
            `Let me break this down more simply: ${response}`,
            `I understand that might be unclear. Here's a different way to think about it: ${response}`
        ];
        return confusionResponses[Math.floor(Math.random() * confusionResponses.length)];
    } else if (sentiment === 'excited') {
        const excitedResponses = [
            `I'm glad you're interested in this! ${response}`,
            `Your enthusiasm for learning is wonderful! ${response}`,
            `It's exciting to explore this topic together! ${response}`,
            `I share your interest in this fascinating subject! ${response}`
        ];
        return excitedResponses[Math.floor(Math.random() * excitedResponses.length)];
    }
   
    return response;
}

module.exports = {
    initializeAI,
    generateResponse
};