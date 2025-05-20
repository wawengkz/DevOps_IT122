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
    // New state variables for profile details display
    const [savedProfile, setSavedProfile] = useState(null);
    const [showProfileDetails, setShowProfileDetails] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
   
    const [learningStats, setLearningStats] = useState({
        totalMessages: 0,
        subjectBreakdown: { math: 0, science: 0, history: 0, general: 0 },
        recentTopics: []
    });
    
    // Follow-up questions state
    const [followUpQuestions, setFollowUpQuestions] = useState([]);
    const [showFollowUps, setShowFollowUps] = useState(false);
    
    // Context awareness notification
    const [isFollowUp, setIsFollowUp] = useState(false);
    
    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Screen size tracking
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });
    const [isMounted, setIsMounted] = useState(false);
    
    const messageEndRef = useRef(null);

    // Initialize window size and mark component as mounted
    useEffect(() => {
        setIsMounted(true);
        
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        
        // Set initial size
        handleResize();
        
        // Add event listener
        window.addEventListener("resize", handleResize);
        
        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Check if the device is mobile
    const isMobile = () => {
        return windowSize.width <= 768;
    };
    
    // Check if the device is small mobile
    const isSmallMobile = () => {
        return windowSize.width <= 480;
    };

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
            setShowFollowUps(false); // Hide any existing follow-up suggestions
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

            // Get user ID (using profile email or anonymous)
            const userId = savedProfile?.email || 'anonymous';

            // Send to backend and get AI response
            const response = await axios.post('http://localhost:3000/api/messages', { 
                text: userMsg,
                userId: userId 
            });

            // Replace the temporary message with the actual one and add AI response
            setMessages(prev => {
                // Filter out the temporary message
                const filteredMessages = prev.filter(msg => msg._id !== tempUserMsg._id);
                // Add the real messages from the API
                return [...filteredMessages, response.data.userMessage, response.data.aiMessage];
            });
            
            // Set follow-up questions if received
            if (response.data.aiMessage.followUpQuestions && 
                response.data.aiMessage.followUpQuestions.length > 0) {
                setFollowUpQuestions(response.data.aiMessage.followUpQuestions);
                setShowFollowUps(true);
            } else {
                setFollowUpQuestions([]);
                setShowFollowUps(false);
            }
            
            // Set context awareness flag
            setIsFollowUp(response.data.aiMessage.isFollowUp || false);
           
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

    // Handle follow-up question click
    const handleFollowUpClick = (question) => {
        setNewMessage(question);
        setShowFollowUps(false);
    };

    // Save user profile - UPDATED
    const saveUserProfile = async () => {
        try {
            setSaveStatus('saving');
           
            // Check if profile already exists
            const response = await axios.get('http://localhost:3000/api/users');
           
            let savedUserData;
           
            if (response.data.users && response.data.users.length > 0) {
                // Update existing profile
                const updateResponse = await axios.put(`http://localhost:3000/api/users/${response.data.users[0]._id}`, userProfile);
                savedUserData = updateResponse.data.user;
            } else {
                // Create new profile
                const createResponse = await axios.post('http://localhost:3000/api/users', userProfile);
                savedUserData = createResponse.data.user;
            }
           
            // Set saved profile data for display
            setSavedProfile(savedUserData || userProfile);
            setShowProfileDetails(true);
            setSaveStatus('saved');
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus('error');
            alert('Failed to save profile. Please try again.');
        }
    };

    // Load user profile
    const loadUserProfile = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/users');
            if (response.data.users && response.data.users.length > 0) {
                const userData = response.data.users[0];
                setUserProfile(userData);
                setSavedProfile(userData);
                setShowProfileDetails(true);
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

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load messages and user profile on component mount
    useEffect(() => {
        if (isMounted) {
            fetchMessages();
            loadUserProfile();
        }
    }, [subjectFilter, isMounted]); // Refetch when filter changes or component mounts

    // Close mobile menu when a view is selected
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [activeView]);

    // Add animation keyframes for the typing indicator
    useEffect(() => {
        if (isMounted) {
            // Create a style element
            const style = document.createElement('style');
            // Add the keyframes animation rule
            style.innerHTML = `
                @keyframes blink {
                    0% { opacity: 0.2; }
                    20% { opacity: 1; }
                    100% { opacity: 0.2; }
                }
            `;
            // Append the style element to the document head
            document.head.appendChild(style);

            // Clean up
            return () => {
                document.head.removeChild(style);
            };
        }
    }, [isMounted]);

    // Render the navigation tabs (used in all views)
    const renderNavTabs = () => (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '20px', 
            width: '100%'
        }}>
            <div style={{ 
                display: 'flex', 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: isSmallMobile() ? '100%' : 'auto',
                flexWrap: isSmallMobile() ? 'wrap' : 'nowrap'
            }}>
                {[
                    { id: 'chat', label: 'Chat' },
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'profile', label: 'Profile' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        style={{
                            padding: isSmallMobile() ? '10px 0' : '12px 24px',
                            border: 'none',
                            backgroundColor: activeView === tab.id ? '#2196f3' : 'transparent',
                            color: activeView === tab.id ? 'white' : '#333',
                            cursor: 'pointer',
                            fontWeight: activeView === tab.id ? 'bold' : 'normal',
                            minWidth: isSmallMobile() ? '33.33%' : '100px',
                            flex: isSmallMobile() ? '1 0 auto' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );

    // Render the profile view - UPDATED
    const renderProfileView = () => (
        <div className="profile-container" style={{ 
            padding: '20px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '100%'
        }}>
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
                disabled={saveStatus === 'saving'}
                style={{
                    padding: '12px 24px',
                    backgroundColor: saveStatus === 'saving' ? '#90CAF9' : '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    width: '100%'
                }}
            >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
            </button>
           
            {/* Profile Details Section - Shows after saving */}
            {showProfileDetails && savedProfile && (
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #4CAF50',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: isSmallMobile() ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isSmallMobile() ? 'flex-start' : 'center',
                        marginBottom: '15px'
                    }}>
                        <h3 style={{ color: '#333', margin: isSmallMobile() ? '0 0 10px 0' : 0 }}>Saved Profile Details</h3>
                        {saveStatus === 'saved' && (
                            <span style={{
                                padding: '4px 10px',
                                backgroundColor: '#E8F5E9',
                                color: '#2E7D32',
                                borderRadius: '50px',
                                fontSize: '14px'
                            }}>
                                Saved Successfully
                            </span>
                        )}
                    </div>
                   
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isSmallMobile() ? '1fr' : 'repeat(2, 1fr)', 
                        gap: '15px' 
                    }}>
                        <div>
                            <p style={{ color: '#757575', fontSize: '14px', margin: '0 0 5px 0' }}>Name</p>
                            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                                {savedProfile.name || "Not provided"}
                            </p>
                        </div>
                       
                        <div>
                            <p style={{ color: '#757575', fontSize: '14px', margin: '0 0 5px 0' }}>Email</p>
                            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                                {savedProfile.email || "Not provided"}
                            </p>
                        </div>
                       
                        <div style={{ gridColumn: isSmallMobile() ? '1' : '1 / span 2' }}>
                            <p style={{ color: '#757575', fontSize: '14px', margin: '0 0 5px 0' }}>Preferred Subjects</p>
                            {savedProfile.preferredSubjects && savedProfile.preferredSubjects.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {savedProfile.preferredSubjects.map(subject => (
                                        <span key={subject} style={{
                                            padding: '4px 10px',
                                            backgroundColor: '#E3F2FD',
                                            color: '#1565C0',
                                            borderRadius: '50px',
                                            fontSize: '14px',
                                            textTransform: 'capitalize'
                                        }}>
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                                    No subjects selected
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render the dashboard view
    const renderDashboardView = () => (
        <div className="dashboard-container" style={{ 
            padding: '20px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '100%'
        }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Learning Dashboard</h2>
           
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#555', marginBottom: '15px' }}>Your Learning Activity</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isSmallMobile() ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
                    gap: '15px',
                    marginBottom: '20px' 
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.totalMessages}</div>
                        <div>Total</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.subjectBreakdown.math || 0}</div>
                        <div>Math</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{learningStats.subjectBreakdown.science || 0}</div>
                        <div>Science</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
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
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                                }`,
                                fontSize: isSmallMobile() ? '14px' : '16px'
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
        <div className="chat-container" style={{width: '100%'}}>
            {/* Subject filter */}
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                    display: 'flex', 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    flexWrap: isSmallMobile() ? 'wrap' : 'nowrap',
                    width: isSmallMobile() ? '100%' : 'auto'
                }}>
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
                                minWidth: isSmallMobile() ? '50%' : '70px',
                                flex: isSmallMobile() ? '1 0 auto' : 'none'
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
                    height: isMobile() ? '400px' : '500px',
                    overflowY: 'auto',
                    padding: isSmallMobile() ? '12px' : '16px',
                    marginBottom: '20px',
                    backgroundColor: '#f9f9f9',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    width: '100%'
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
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                {messages.map((message) => (
                                    <li
                                        key={message._id}
                                        style={{
                                            padding: isSmallMobile() ? '10px 12px' : '12px 16px',
                                            margin: '8px 0',
                                            backgroundColor: message.isUser ? '#e3f2fd' :
                                                            message.category === 'math' ? '#e8f5e9' :
                                                            message.category === 'science' ? '#e3f2fd' :
                                                            message.category === 'history' ? '#fff3e0' : '#e8f5e9',
                                            color: '#333',
                                            borderRadius: '12px',
                                            maxWidth: isSmallMobile() ? '90%' : '80%',
                                            wordBreak: 'break-word',
                                            marginLeft: message.isUser ? 'auto' : '0',
                                            marginRight: message.isUser ? '0' : 'auto',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            fontSize: isSmallMobile() ? '14px' : '16px'
                                        }}
                                    >
                                        <div style={{ margin: '0 0 5px 0', lineHeight: '1.5' }}>{message.text}</div>
                                        <div style={{
                                            fontSize: isSmallMobile() ? '10px' : '12px',
                                            color: '#666',
                                            textAlign: message.isUser ? 'right' : 'left',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <span>{message.isUser ? 'You' : 'AI Tutor'}</span>
                                            {!message.isUser && message.category && (
                                                <span style={{
                                                    marginLeft: '2px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: isSmallMobile() ? '8px' : '10px',
                                                    backgroundColor: message.category === 'math' ? '#4CAF50' :
                                                                    message.category === 'science' ? '#2196F3' :
                                                                    message.category === 'history' ? '#FF9800' : '#9E9E9E',
                                                    color: 'white',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {message.category}
                                                </span>
                                            )}
                                            {!message.isUser && message.isFollowUp && (
                                                <span style={{
                                                    marginLeft: '2px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: isSmallMobile() ? '8px' : '10px',
                                                    backgroundColor: '#9C27B0',
                                                    color: 'white'
                                                }}>
                                                    Follow-up
                                                </span>
                                            )}
                                            <span>• {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                    </li>
                                ))}
                                {isTyping && (
                                    <li
                                        style={{
                                            padding: isSmallMobile() ? '10px 12px' : '12px 16px',
                                            margin: '8px 0',
                                            backgroundColor: '#e8f5e9',
                                            color: '#333',
                                            borderRadius: '12px',
                                            maxWidth: isSmallMobile() ? '90%' : '80%',
                                            marginLeft: '0',
                                            marginRight: 'auto',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: '8px' }}>AI tutor is typing</span>
                                            <div className="typing-indicator" style={{
                                                display: 'flex',
                                                gap: '4px'
                                            }}>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4CAF50',
                                                    animation: 'blink 1s infinite 0s'
                                                }}></span>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4CAF50',
                                                    animation: 'blink 1s infinite 0.2s'
                                                }}></span>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4CAF50',
                                                    animation: 'blink 1s infinite 0.4s'
                                                }}></span>
                                            </div>
                                        </div>
                                    </li>
                                )}
                                <div ref={messageEndRef} />
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Follow-up questions suggestion */}
            {showFollowUps && followUpQuestions.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ 
                        marginBottom: '10px', 
                        fontSize: isSmallMobile() ? '12px' : '14px', 
                        color: '#555' 
                    }}>
                        Follow-up questions:
                    </p>
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px' 
                    }}>
                        {followUpQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => handleFollowUpClick(question)}
                                style={{
                                    padding: isSmallMobile() ? '6px 10px' : '8px 12px',
                                    backgroundColor: '#e3f2fd',
                                    border: '1px solid #bbdefb',
                                    borderRadius: '20px',
                                    fontSize: isSmallMobile() ? '12px' : '14px',
                                    color: '#1976d2',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    flex: isSmallMobile() ? '1 1 auto' : 'none',
                                    maxWidth: isSmallMobile() ? 'fit-content' : 'none',
                                    textAlign: 'center'
                                }}
                                onMouseOver={(e) => { e.target.style.backgroundColor = '#bbdefb'; }}
                                onMouseOut={(e) => { e.target.style.backgroundColor = '#e3f2fd'; }}
                            >
                                {question.length > 40 && isSmallMobile() 
                                    ? question.substring(0, 37) + '...' 
                                    : question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask a question..."
                    style={{
                        flex: '1',
                        padding: isSmallMobile() ? '12px 14px' : '14px 16px',
                        borderRadius: '12px 0 0 12px',
                        border: '1px solid #ddd',
                        fontSize: isSmallMobile() ? '14px' : '16px',
                        outline: 'none'
                    }}
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    style={{
                        padding: isSmallMobile() ? '12px 16px' : '14px 24px',
                        backgroundColor: isTyping ? '#90caf9' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0 12px 12px 0',
                        fontSize: isSmallMobile() ? '14px' : '16px',
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

    // Show loading state or render the component
    if (!isMounted) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: isMobile() ? '15px' : '20px',
                borderBottom: '1px solid #eee',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 10,
                marginBottom: '10px'
            }}>
                <h1 style={{ 
                    textAlign: 'center', 
                    color: '#333', 
                    margin: 0,
                    fontSize: isSmallMobile() ? '1.5rem' : '2rem'
                }}>
                    BrainBytes AI Tutor
                </h1>
            </div>

            <div style={{ 
                maxWidth: '100%', 
                padding: isSmallMobile() ? '10px' : '20px', 
                fontFamily: 'Nunito, sans-serif',
                margin: '0 auto',
                width: isMobile() ? '100%' : '800px'
            }}>
                {/* Navigation always visible in all views */}
                {renderNavTabs()}
               
                {/* Render the active view */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {activeView === 'chat' && renderChatView()}
                    {activeView === 'profile' && renderProfileView()}
                    {activeView === 'dashboard' && renderDashboardView()}
                </div>
            </div>
        </>
    );
}