// app/page.js
'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
// import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import InputArea from './components/InputArea';
import FrequentQuestionsTile from './components/FrequentQuestionsTile';
import SubscriptionTile from './components/SubscriptionTile';
import UserProfileTile from './components/UserProfileTile';
import MobileMenu from './components/MobileMenu';
import ConversationList from './components/ConversationList';
import { useSession } from 'next-auth/react';

// Define the type for a message
interface Message {
  text: string;
  sender: string;
  id?: string;
  createdAt?: Date;
}

// Define the type for a conversation
interface Conversation {
  conversationId: string;
  createdAt: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && session !== null;

  // Fetch conversations when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  // Fetch conversation history when activeConversationId changes
  useEffect(() => {
    if (activeConversationId && isAuthenticated) {
      fetchConversationMessages(activeConversationId);
    } else {
      // Clear messages if no active conversation
      setMessages([]);
    }
  }, [activeConversationId, isAuthenticated]);

  // Debug session in Home component
  useEffect(() => {
    console.log("Session in Home component:", session);
    console.log("Auth status in Home component:", status);
    console.log("Is authenticated:", isAuthenticated);
  }, [session, status, isAuthenticated]);

  // Function to fetch user's conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat');
      if (!response.ok) {
        console.error('Failed to fetch conversations');
        return;
      }
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Function to fetch messages for a specific conversation
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`);
      if (!response.ok) {
        console.error('Failed to fetch conversation messages');
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    }
  };

  // Function to handle creating a new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  // Function to handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  // Function to handle suggestion chip clicks
  const handleSuggestionClick = (text: string) => {
    if (!isLoading) {
      handleSubmit(text);
    }
  };

  // Function to handle lab results file upload
  const handleFileUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('برای آپلود نتایج آزمایش، لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }
    
    // Add a user message about uploading a file
    const userMessage: Message = { 
      text: `آپلود نتایج آزمایش: ${file.name}`, 
      sender: 'user' 
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add a temporary loading message from the bot
    const loadingMessage: Message = {
      text: 'در حال پردازش نتایج آزمایش...',
      sender: 'bot',
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    setIsLoading(true);
    
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'lab_results');
    if (activeConversationId) {
      formData.append('conversationId', activeConversationId);
    }
    
    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // Try to get more detailed error info from the response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          console.error('Upload error details:', errorData);
          errorDetails = errorData.details || errorData.error || `Status: ${response.status}`;
        } catch (jsonError) {
          errorDetails = `Status: ${response.status}`;
        }
        
        throw new Error(`Upload failed with status: ${response.status}. ${errorDetails}`);
      }
      
      const data = await response.json();
      
      // Replace the loading message with the actual bot response
      const botResponse: Message = { 
        text: data.response, 
        sender: 'bot',
        id: data.labResultsDetected ? `lab_results_${Date.now()}` : undefined
      };
      
      // If lab results were saved directly
      if (data.labResultsSaved) {
        botResponse.text = `${botResponse.text} <a href="/profile#laboratory" class="lab-results-link">مشاهده نتایج آزمایش</a>`;
      }
      
      // Replace loading message with bot response
      setMessages(prev => [...prev.slice(0, -1), botResponse]);
      
      // Set conversation ID if this is a new conversation
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        // Refresh conversations list
        if (isAuthenticated) {
          fetchConversations();
        }
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      // Show detailed error message
      const errorMessage: Message = {
        text: `خطا در آپلود فایل: ${error instanceof Error ? error.message : 'لطفا مجددا تلاش کنید.'}`,
        sender: 'bot'
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (message: string) => {
    // Add user message
    const userMessage: Message = { text: message, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Add a temporary loading message from the bot
    const loadingMessage: Message = {
      text: 'در حال پردازش پاسخ...',
      sender: 'bot',
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call your backend API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          conversationId: activeConversationId // Include current conversation ID if it exists
        }),
      });

      if (!response.ok) {
        // Handle API errors (e.g., show an error message)
        let errorText = 'Failed to get response';
        try {
          const errorData = await response.json();
          console.error(`API Error (Status ${response.status}):`, errorData);
          errorText = errorData.error || JSON.stringify(errorData);
        } catch (_) {
          // If JSON parsing fails, try to get the raw text
          try {
            const rawError = await response.text();
            console.error(`API Error (Status ${response.status}, Non-JSON):`, rawError);
            errorText = rawError || `Status ${response.status}`;
          } catch (textError) {
            console.error(`API Error (Status ${response.status}, Unreadable body):`, textError);
            errorText = `Status ${response.status}`;
          }
        }
        const errorMessage: Message = {
          text: `خطا: ${errorText}`,
          sender: 'bot'
        };
        // Replace loading message with error message
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        return;
      }

      const data = await response.json();
      const botResponse: Message = { text: data.response, sender: 'bot' };
      
      // Check if lab results were detected
      if (data.labResultsDetected) {
        // Enhance the message with special styling or actions if needed
        botResponse.id = `lab_results_${Date.now()}`;
        // The response already contains the prompt to save from the API
      }
      
      // Check if lab results were saved
      if (data.labResultsSaved) {
        // Add a link to profile in the message
        botResponse.text = `${botResponse.text} <a href="/profile#laboratory" class="lab-results-link">مشاهده نتایج آزمایش</a>`;
      }

      // Replace the loading message with the actual bot response
      setMessages(prev => [...prev.slice(0, -1), botResponse]);

      // Update the active conversation ID if this is a new conversation
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        // Refresh conversations list
        if (isAuthenticated) {
          fetchConversations();
        }
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      const errorMessage: Message = {
        text: 'خطا در برقراری ارتباط با سرور.',
        sender: 'bot'
      };
      // Replace loading message with error message
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);

    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear messages
  const handleClearChat = () => {
    setMessages([]); 
  };

  // Function to handle lab result actions (save or discard)
  const handleLabResultAction = async (action: string) => {
    if (action === 'save-lab-results') {
      // Add a user message confirming they want to save the results
      const userMessage: Message = { 
        text: 'بله، ذخیره شود', 
        sender: 'user' 
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add a temporary loading message from the bot
      const loadingMessage: Message = {
        text: 'در حال ذخیره نتایج آزمایش...',
        sender: 'bot',
      };
      setMessages(prev => [...prev, loadingMessage]);
      
      try {
        // Call the API to save the lab results
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'بله',
            conversationId: activeConversationId
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Replace the loading message with the confirmation message
        const botResponse: Message = { 
          text: data.response, 
          sender: 'bot' 
        };
        
        // Add a link to profile if lab results were saved
        if (data.labResultsSaved) {
          botResponse.text = `${botResponse.text} <a href="/profile#laboratory" class="lab-results-link">مشاهده نتایج آزمایش</a>`;
        }
        
        // Replace loading message with confirmation
        setMessages(prev => [...prev.slice(0, -1), botResponse]);
        
      } catch (error) {
        console.error('Error saving lab results:', error);
        const errorMessage: Message = {
          text: 'خطا در ذخیره نتایج آزمایش. لطفاً مجدداً تلاش کنید.',
          sender: 'bot'
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      }
    } else if (action === 'discard-lab-results') {
      // Add a user message indicating they don't want to save the results
      const userMessage: Message = { 
        text: 'خیر، ذخیره نشود', 
        sender: 'user' 
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add a bot message acknowledging the decision
      const botResponse: Message = { 
        text: 'باشه، نتایج آزمایش ذخیره نشد. آیا می‌توانم به شما کمک دیگری بکنم؟', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botResponse]);
    }
  };

  return (
    <div className={styles.container}>
      {/* Mobile menu (hamburger) */}
      <MobileMenu onQuestionClick={handleSuggestionClick} />

      <div className={styles.appContainer}>
        {/* Left Sidebar - Conversation history (only for logged in users) */}
        {isAuthenticated && (
          <div className={styles.leftSidebar}>
            <ConversationList 
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className={styles.mainContent}>
          {/* Add Clear Chat Button Back Here */}
          {messages.length > 0 && ( // Only show if there are messages
            <button
              onClick={handleClearChat}
              className={styles.clearButton} // Keep class for now, will adjust styles
              disabled={isLoading}
            >
              پاک کردن گفتگو
            </button>
          )}

          <ChatContainer 
            messages={messages} 
            isLoading={isLoading}
            onLabResultAction={handleLabResultAction}
          />
          <InputArea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            onSubmit={() => {
              if (inputValue.trim() && !isLoading) {
                handleSubmit(inputValue);
              }
            }}
            disabled={isLoading}
            onFileUpload={handleFileUpload}
          />
        </div>

        {/* Right Sidebar - Only show on desktop */}
        <div className={styles.rightSidebar}>
          <UserProfileTile />
          <SubscriptionTile />
          <FrequentQuestionsTile onQuestionClick={handleSuggestionClick} />
        </div>
      </div>
    </div>
  );
}