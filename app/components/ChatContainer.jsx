// app/components/ChatContainer.jsx
'use client';

import { useRef, useEffect } from 'react';
import styles from './ChatContainer.module.css';
import ReactMarkdown from 'react-markdown';

export default function ChatContainer({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      {messages.length === 0 ? (
        <div className={styles.welcomeMessage}>
          <h1>سلام، به چت‌بات پزشکی خوش آمدید</h1>
          <p>چگونه می‌توانم به شما کمک کنم؟</p>
          <p>می‌توانید از سوالات متداول در سمت راست استفاده کنید یا سوال خود را مستقیماً بپرسید.</p>
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