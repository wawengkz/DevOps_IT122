import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
    // State variables
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [activeView, setActiveView] = useState('chat'); // 'chat', 'profile', or 'dashboard'
    const [subjectFilter, setSubjectFilter] = useState('all'); // 'all', 'math', 'science', 'history'
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        preferredSubjects: []
    });
    const [learningStats, setLearningStats] = useState({
        totalMessages: 0,
        subjectBreakdown: { math: 0, science: 0, history: 0, general: 0 },
        recentTopics: []
    });
    const messageEndRef = useRef(null);

    // Fetch messages from the API
    const fetchMessages = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/messages');
            const allMessages = response.data;
            
            // Apply subject filter if not 'all'
            if (subjectFilter !== 'all') {
                // This filtering assumes the AI response includes category info
                const filteredMessages = [];
                for (let i = 0; i < allMessages.length; i += 2) {
                    const userMsg = allMessages[i];
                    const aiMsg = allMessages[i + 1];
                    
                    // Keep if AI message category matches the filter or if we don't have a pair
                    if (!aiMsg || !aiMsg.category || aiMsg.category === subjectFilter) {
                        filteredMessages.push(userMsg);
                        if (aiMsg) filteredMessages.push(aiMsg);
                    }
                }
                setMessages(filteredMessages);
            } else {
                setMessages(allMessages);
            }
            
            setLoading(false);
            updateLearningStats(allMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    // Update learning statistics
    const updateLearningStats = (messages) => {
        // Count messages by category
        const subjectBreakdown = { math: 0, science: 0, history: 0, general: 0 };
        const recentTopics = [];
        
        // Only count AI messages (even indices are user, odd are AI responses)
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg.isUser && msg.category) {
                subjectBreakdown[msg.category] = (subjectBreakdown[msg.category] || 0) + 1;
                
                // Add to recent topics if not already included
                if (msg.text.length > 20 && !recentTopics.some(topic => topic.text === msg.text.substring(0, 50))) {
                    recentTopics.push({
                        text: msg.text.substring(0, 50) + '...',
                        category: msg.category,
                        date: new Date(msg.createdAt)
                    });
                }
            }
        }
        
        // Sort recent topics by date (newest first) and keep only the latest 5
        recentTopics.sort((a, b) => b.date - a.date);
        
        setLearningStats({
            totalMessages: Math.floor(messages.length / 2), // Count conversation pairs
            subjectBreakdown,
            recentTopics: recentTopics.slice(0, 5)
        });
    };

    // Submit a new message
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setIsTyping(true); // Show typing indicator
            const userMsg = newMessage;
            setNewMessage('');

            // Optimistically add user message to UI
            const tempUserMsg = {
                _id: Date.now().toString(),
                text: userMsg,
                isUser: true,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempUserMsg]);

            // Send to backend and get AI response
            const response = await axios.post('http://localhost:3000/api/messages', { text: userMsg });

            // Replace the temporary message with the actual one and add AI response
            setMessages(prev => {
                // Filter out the temporary message
                const filteredMessages = prev.filter(msg => msg._id !== tempUserMsg._id);
                // Add the real messages from the API
                return [...filteredMessages, response.data.userMessage, response.data.aiMessage];
            });
            
            // Update learning stats
            fetchMessages();
        } catch (error) {
            console.error('Error posting message:', error);
            // Show error in chat
            setMessages(prev => [...prev, {
                _id: Date.now().toString(),
                text: "Sorry, I couldn't process your request. Please try again later.",
                isUser: false,
                createdAt: new Date().toISOString()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Save user profile
    const saveUserProfile = async () => {
        try {
            // Check if profile already exists
            const response = await axios.get('http://localhost:3000/api/users');
            
            if (response.data.users && response.data.users.length > 0) {
                // Update existing profile
                await axios.put(`http://localhost:3000/api/users/${response.data.users[0]._id}`, userProfile);
            } else {
                // Create new profile
                await axios.post('http://localhost:3000/api/users', userProfile);
            }
            
            alert('Profile saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    };

    // Load user profile
    const loadUserProfile = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/users');
            if (response.data.users && response.data.users.length > 0) {
                setUserProfile(response.data.users[0]);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    // Handle preference checkbox changes
    const handlePreferenceChange = (subject) => {
        setUserProfile(prev => {
            const updatedPreferences = prev.preferredSubjects.includes(subject)
                ? prev.preferredSubjects.filter(s => s !== subject)
                : [...prev.preferredSubjects, subject];
                
            return { ...prev, preferredSubjects: updatedPreferences };
        });
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load messages and user profile on component mount
    useEffect(() => {
        fetchMessages();
        loadUserProfile();
    }, [subjectFilter]); // Refetch when filter changes

    // Render the profile view
    const renderProfileView = () => (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>User Profile</h2>
            
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '16px'
                    }}
                />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '16px'
                    }}
                />
            </div>
            
            <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Preferred Subjects:</label>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {['Math', 'Science', 'History'].map((subject) => (
                        <div key={subject} style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                id={`subject-${subject.toLowerCase()}`}
                                checked={userProfile.preferredSubjects.includes(subject.toLowerCase())}
                                onChange={() => handlePreferenceChange(subject.toLowerCase())}
                                style={{ marginRight: '5px' }}
                            />
                            <label htmlFor={`subject-${subject.toLowerCase()}`}>{subject}</label>
                        </div>
                    ))}
                </div>
            </div>
            
            <button
                onClick={saveUserProfile}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}
            >
                Save Profile
            </button>
        </div>
    );

    // Render the dashboard view
    const renderDashboardView = () => (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Learning Dashboard</h2>
            
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#555', marginBottom: '15px' }}>Your Learning Activity</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.totalMessages}</div>
                        <div>Total Conversations</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.subjectBreakdown.math || 0}</div>
                        <div>Math</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.subjectBreakdown.science || 0}</div>
                        <div>Science</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.subjectBreakdown.history || 0}</div>
                        <div>History</div>
                    </div>
                </div>
                
                {/* Progress bars */}
                {['math', 'science', 'history'].map(subject => {
                    const count = learningStats.subjectBreakdown[subject] || 0;
                    const total = learningStats.totalMessages || 1; // Avoid division by zero
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                        <div key={subject} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ textTransform: 'capitalize' }}>{subject}</span>
                                <span>{percentage}%</span>
                            </div>
                            <div style={{ height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${percentage}%`,
                                    backgroundColor: subject === 'math' ? '#4CAF50' : subject === 'science' ? '#2196F3' : '#FF9800',
                                    borderRadius: '5px'
                                }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div>
                <h3 style={{ color: '#555', marginBottom: '15px' }}>Recent Learning Topics</h3>
                {learningStats.recentTopics.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {learningStats.recentTopics.map((topic, index) => (
                            <li key={index} style={{ 
                                padding: '15px', 
                                marginBottom: '10px', 
                                borderRadius: '8px',
                                backgroundColor: topic.category === 'math' ? '#e8f5e9' : 
                                                topic.category === 'science' ? '#e3f2fd' : 
                                                topic.category === 'history' ? '#fff3e0' : '#f5f5f5',
                                borderLeft: `5px solid ${
                                    topic.category === 'math' ? '#4CAF50' : 
                                    topic.category === 'science' ? '#2196F3' : 
                                    topic.category === 'history' ? '#FF9800' : '#9E9E9E'
                                }`
                            }}>
                                <div style={{ marginBottom: '5px' }}>{topic.text}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    <span style={{ textTransform: 'capitalize' }}>{topic.category}</span> • {topic.date.toLocaleDateString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No learning activity recorded yet. Start a conversation to see your topics here!</p>
                )}
            </div>
        </div>
    );

    // Render the chat view
    const renderChatView = () => (
        <div>
            {/* Subject filter */}
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {['all', 'math', 'science', 'history'].map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSubjectFilter(subject)}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                backgroundColor: subjectFilter === subject ? '#2196f3' : 'transparent',
                                color: subjectFilter === subject ? 'white' : '#333',
                                cursor: 'pointer',
                                fontWeight: subjectFilter === subject ? 'bold' : 'normal',
                                minWidth: '70px'
                            }}
                        >
                            {subject === 'all' ? 'All' : subject.charAt(0).toUpperCase() + subject.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={{
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    height: '500px',
                    overflowY: 'auto',
                    padding: '16px',
                    marginBottom: '20px',
                    backgroundColor: '#f9f9f9',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>Loading conversation history...</p>
                    </div>
                ) : (
                    <div>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <h3>Welcome to BrainBytes AI Tutor!</h3>
                                <p>Ask me any question about math, science, or history.</p>
                            </div>
                        ) : (
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {messages.map((message) => (
                                    <li
                                        key={message._id}
                                        style={{
                                            padding: '12px 16px',
                                            margin: '8px 0',
                                            backgroundColor: message.isUser ? '#e3f2fd' : 
                                                            message.category === 'math' ? '#e8f5e9' : 
                                                            message.category === 'science' ? '#e3f2fd' : 
                                                            message.category === 'history' ? '#fff3e0' : '#e8f5e9',
                                            color: '#333',
                                            borderRadius: '12px',
                                            maxWidth: '80%',
                                            wordBreak: 'break-word',
                                            marginLeft: message.isUser ? 'auto' : '0',
                                            marginRight: message.isUser ? '0' : 'auto',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ margin: '0 0 5px 0', lineHeight: '1.5' }}>{message.text}</div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            textAlign: message.isUser ? 'right' : 'left',
                                            display: 'flex',
                                            justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                            alignItems: 'center'
                                        }}>
                                            {message.isUser ? 'You' : 'AI Tutor'} 
                                            {!message.isUser && message.category && (
                                                <span style={{
                                                    marginLeft: '5px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    backgroundColor: message.category === 'math' ? '#4CAF50' : 
                                                                    message.category === 'science' ? '#2196F3' : 
                                                                    message.category === 'history' ? '#FF9800' : '#9E9E9E',
                                                    color: 'white',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {message.category}
                                                </span>
                                            )}
                                            <span style={{ marginLeft: '5px' }}>• {new Date(message.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </li>
                                ))}
                                {isTyping && (
                                    <li
                                        style={{
                                            padding: '12px 16px',
                                            margin: '8px 0',
                                            backgroundColor: '#e8f5e9',
                                            color: '#333',
                                            borderRadius: '12px',
                                            maxWidth: '80%',
                                            marginLeft: '0',
                                            marginRight: 'auto',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ margin: '0' }}>AI tutor is typing...</div>
                                    </li>
                                )}
                                <div ref={messageEndRef} />
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask a question..."
                    style={{
                        flex: '1',
                        padding: '14px 16px',
                        borderRadius: '12px 0 0 12px',
                        border: '1px solid #ddd',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    style={{
                        padding: '14px 24px',
                        backgroundColor: isTyping ? '#90caf9' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0 12px 12px 0',
                        fontSize: '16px',
                        cursor: isTyping ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    disabled={isTyping}
                >
                    {isTyping ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>BrainBytes AI Tutor</h1>
            
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {[
                        { id: 'chat', label: 'Chat' },
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'profile', label: 'Profile' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                backgroundColor: activeView === tab.id ? '#2196f3' : 'transparent',
                                color: activeView === tab.id ? 'white' : '#333',
                                cursor: 'pointer',
                                fontWeight: activeView === tab.id ? 'bold' : 'normal',
                                minWidth: '100px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Render the active view */}
            {activeView === 'chat' && renderChatView()}
            {activeView === 'profile' && renderProfileView()}
            {activeView === 'dashboard' && renderDashboardView()}
        </div>
    );
}