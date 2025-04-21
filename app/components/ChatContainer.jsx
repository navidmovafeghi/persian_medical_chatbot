// app/components/ChatContainer.jsx
'use client';

import { useRef, useEffect } from 'react';
import styles from './ChatContainer.module.css';

export default function ChatContainer({ messages, isLoading, onLabResultAction }) {
  const bottomRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle lab result button clicks
  const handleLabResultButtonClick = (e, action, labResults) => {
    e.preventDefault();
    if (onLabResultAction) {
      onLabResultAction(action, labResults);
    }
  };

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

  // Process message text to enhance buttons with click handlers
  const processMessageContent = (message) => {
    // If message contains lab result action buttons
    if (message.text.includes('data-action="save-lab-results"')) {
      return (
        <div dangerouslySetInnerHTML={{ 
          __html: message.text.replace(
            /<button class="action-button save-results" data-action="save-lab-results">(.*?)<\/button>/g,
            `<button class="action-button save-results" onclick="document.dispatchEvent(new CustomEvent('lab-result-action', {detail: {action: 'save-lab-results'}}))">$1</button>`
          ).replace(
            /<button class="action-button discard-results" data-action="discard-lab-results">(.*?)<\/button>/g,
            `<button class="action-button discard-results" onclick="document.dispatchEvent(new CustomEvent('lab-result-action', {detail: {action: 'discard-lab-results'}}))">$1</button>`
          )
        }} />
      );
    }
    
    // For messages with links
    if (message.text.includes('<a href=')) {
      return <div dangerouslySetInnerHTML={{ __html: message.text }} />;
    }
    
    // Regular text messages
    return message.text;
  };

  // Add event listener for lab result actions
  useEffect(() => {
    const handleLabAction = (e) => {
      if (onLabResultAction) {
        onLabResultAction(e.detail.action);
      }
    };
    
    document.addEventListener('lab-result-action', handleLabAction);
    
    return () => {
      document.removeEventListener('lab-result-action', handleLabAction);
    };
  }, [onLabResultAction]);

  return (
    <div className={styles.chatContainer}>
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        messages.map((message, index) => {
          // Check if this is a lab results message
          const isLabResults = message.id?.startsWith('lab_results_') || 
                              message.text.includes('data-action="save-lab-results"');
          
          return (
            <div
              key={message.id || index}
              className={`${styles.message} ${
                message.sender === 'user' ? styles.userMessage : styles.botMessage
              } ${isLabResults ? styles.labResultsMessage : ''}`}
            >
              {processMessageContent(message)}
            </div>
          );
        })
      )}
      
      {isLoading && renderLoading()}
      
      <div ref={bottomRef} />
    </div>
  );
}