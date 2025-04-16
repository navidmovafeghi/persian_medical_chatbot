// app/page.js
'use client';

import { useState } from 'react';
import styles from './page.module.css';
// import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import InputArea from './components/InputArea';

// Define the type for a message
interface Message {
  text: string;
  sender: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        // Handle API errors (e.g., show an error message)
        const errorData = await response.json();
        console.error("API Error:", errorData);
        const errorMessage: Message = {
          text: `خطا: ${errorData.error || 'Failed to get response'}`,
          sender: 'bot'
        };
        // Replace loading message with error message
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        return;
      }

      const data = await response.json();
      const botResponse: Message = { text: data.response, sender: 'bot' };

      // Replace the loading message with the actual bot response
      setMessages(prev => [...prev.slice(0, -1), botResponse]);

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

  return (
    <div className={styles.container}>
      <div className={styles.appContainer}>
        <div className={styles.mainContent}>
          {/* Add Clear Chat Button */}  
          {messages.length > 0 && ( // Only show if there are messages
            <button 
              onClick={handleClearChat}
              className={styles.clearButton} // Add CSS class for styling
              disabled={isLoading} // Optionally disable while loading
            >
              پاک کردن گفتگو {/* "Clear Chat" */}
            </button>
          )}

          <ChatContainer messages={messages} />
          <InputArea 
            value={inputValue} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            onSubmit={() => {
              if (inputValue.trim() && !isLoading) {
                handleSubmit(inputValue);
              }
            }} 
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}