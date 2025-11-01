import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import axios from 'axios';
import { FilteredTextInput } from './components/FilteredTextinput';
import Login from './components/Login';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

// Define the structure for a message and the chat history
interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const UserIcon: FC = () => <div className="avatar-icon">Y</div>;
const ModelIcon: FC = () => {
  return <div className="avatar-icon model-icon">✨</div>;
}

const ChevronLeftIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const ChevronRightIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
  </svg>
);

const AppTitle: FC = () => (
  <div className="app-title-wrapper">
    <div className="app-title">Mini Gemini chat</div>
    <div className="app-subtitle">powered by Gemini 2.5 Flash lite</div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);


  // Load conversations from local storage on initial render
  useEffect(() => {
    try {
      const storedConversations = localStorage.getItem('chatConversations');
      if (storedConversations) {
        const parsedConversations: Conversation[] = JSON.parse(storedConversations);
        if (Array.isArray(parsedConversations) && parsedConversations.length > 0) {
          setConversations(parsedConversations);
          setCurrentConversationId(parsedConversations[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load conversations from local storage:", error);
      localStorage.removeItem('chatConversations');
    }

    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Save conversations to local storage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chatConversations', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('chatConversations');
    }
  }, [conversations]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentConversationId]);

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const history = currentConversation ? currentConversation.messages : [];

  const handleSend = async (prompt: string) => {
    if (!prompt || isLoading) return;

    setIsLoading(true);

    let conversationToUpdate: Conversation;
    let newConversation = false;

    if (!currentConversationId) {
      newConversation = true;
      const newId = Date.now().toString();
      conversationToUpdate = { id: newId, title: prompt.substring(0, 40), messages: [] };
      setCurrentConversationId(newId);
    } else {
      conversationToUpdate = conversations.find(c => c.id === currentConversationId)!;
    }

    // Add user message to history immediately for a responsive UI
    const userMessage: Message = { role: 'user', parts: [{ text: prompt }] };
    const updatedMessages = [...conversationToUpdate.messages, userMessage];
    const tempConversation = { ...conversationToUpdate, messages: updatedMessages };

    if (newConversation) {
      setConversations(prev => {
        const newConversations = [tempConversation, ...prev];
        if (newConversations.length > 10) {
          return newConversations.slice(0, 10);
        }
        return newConversations;
      });
    } else {
      setConversations(prev => prev.map(c => c.id === currentConversationId ? tempConversation : c));
    }

    // Prepare history for the API call, limiting it to the last 5 turns (10 messages).
    // Each message is also truncated to a max length to control token usage.
    const MAX_MESSAGES_FOR_API = 10; // 5 turns (user + model)
    const MAX_MESSAGE_LENGTH = 1000; // Truncate message text

    const apiHistory = updatedMessages.slice(-MAX_MESSAGES_FOR_API).map(msg => {
      if (msg.parts[0].text.length > MAX_MESSAGE_LENGTH) {
        return {
          ...msg,
          parts: [{
            ...msg.parts[0],
            text: msg.parts[0].text.substring(0, MAX_MESSAGE_LENGTH) + '...'
          }]
        };
      }
      return msg;
    });


    try {
      // Call our backend API
      const apiResponse = await axios.post(import.meta.env.VITE_API_URL, {
        history: apiHistory,
        message: prompt,
      });
      const data = apiResponse.data;

      // Add AI response to history
      const aiMessage: Message = { role: 'model', parts: [{ text: data.response }] };
      const finalMessages = [...updatedMessages, aiMessage];
      const finalConversation = { ...conversationToUpdate, messages: finalMessages };

      setConversations(prev => {
        if (newConversation) {
          // The new conversation was already added, just update its messages
          return prev.map(c => c.id === finalConversation.id ? finalConversation : c);
        }
        return prev.map(c => c.id === currentConversationId ? finalConversation : c);
      });

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { role: 'model', parts: [{ text: "⚠️ Sorry, something went wrong." }] };
      const finalMessages = [...updatedMessages, errorMessage];
      const finalConversation = { ...conversationToUpdate, messages: finalMessages };
      setConversations(prev => prev.map(c => c.id === finalConversation.id ? finalConversation : c));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">        <button onClick={toggleSidebar} className="sidebar-toggle-button">
          {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
        <button onClick={handleNewChat} className="new-chat-button">
          + New Chat
        </button>
        <nav className="conversation-history">
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={`conversation-item ${convo.id === currentConversationId ? 'active' : ''}`}
              onClick={() => setCurrentConversationId(convo.id)}
            >
              {convo.title}
            </div>
          ))}
        </nav>
        <div className="developer-credit">
          Developed by N. Lokeshraj
        </div>
      </aside>
      <div className="chat-container">
        <header className="chat-header">
          <AppTitle />
        </header>
        <main className="chat-history">
          {history.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'user' ? <UserIcon /> : <ModelIcon />}
              </div>
              <div className="message-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper model loading">
              <div className="avatar">
                <ModelIcon />
              </div>
              <div className="message-bubble">
                <div className="thinking-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>
        <footer className="chat-input-area">
          <FilteredTextInput onSend={handleSend} disabled={isLoading} />
        </footer>
      </div>
    </div>
  );
}

export default App;