// app/components/ChatContainer.jsx
'use client';

import { useRef, useEffect } from 'react';
import styles from './ChatContainer.module.css';
import ReactMarkdown from 'react-markdown';

export default function ChatContainer({ messages }) {
  const suggestionChips = [
    "علائم کرونا چیست؟",
    "چگونه فشار خون را کنترل کنم؟",
    "مقدار مصرف داروی استامینوفن",
    "توصیه برای سردرد میگرنی"
  ];

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChipClick = (text) => {
    // This would be implemented to interact with the parent component
    console.log("Selected suggestion:", text);
    // You could use a callback passed from the parent or context API
  };

  return (
    <div className={styles.chatContainer}>
      {messages.length === 0 ? (
        <div className={styles.welcomeMessage}>
          <h1>سلام، به چت‌بات پزشکی خوش آمدید</h1>
          <p>چگونه می‌توانم به شما کمک کنم؟</p>
          
          <div className={styles.suggestionChips}>
            {suggestionChips.map((chip, index) => (
              <button 
                key={index} 
                className={styles.chip}
                onClick={() => handleChipClick(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}