// app/components/ChatContainer.jsx
'use client';

import { useRef, useEffect } from 'react';
import styles from './ChatContainer.module.css';

export default function ChatContainer({ messages, isLoading }) {
  const bottomRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show loading indicator for the bot message
  const renderLoading = () => (
    <div className={`${styles.message} ${styles.botMessage}`}>
      <div className={styles.loadingDots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
    </div>
  );

  // Empty state when no messages
  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>💬</div>
      <h2>چت‌بات پزشکی</h2>
      <p>سوال پزشکی خود را بپرسید تا پاسخ آن را دریافت کنید</p>
    </div>
  );

  return (
    <div className={styles.chatContainer}>
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.sender === 'user' ? styles.userMessage : styles.botMessage
            }`}
          >
            {message.text}
          </div>
        ))
      )}
      
      {isLoading && renderLoading()}
      
      <div ref={bottomRef} />
    </div>
  );
}