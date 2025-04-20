'use client';

import { useState } from 'react';
import styles from './Tile.module.css'; // Reusing existing styles

// Format date function for readability
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelectConversation,
  onNewConversation
}) {
  
  return (
    <div className={styles.tile} style={{ height: '100%', overflow: 'auto' }}>
      <h2 className={styles.tileTitle}>تاریخچه گفتگوها</h2>
      
      {/* Button to start a new conversation */}
      <button 
        onClick={onNewConversation}
        className={styles.newConversationButton}
        style={{
          padding: '8px 12px',
          margin: '0 0 16px 0',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'inherit',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span>+</span> گفتگوی جدید
      </button>
      
      {conversations.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>هنوز گفتگویی ندارید</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {conversations.map((conversation) => (
            <li 
              key={conversation.conversationId}
              onClick={() => onSelectConversation(conversation.conversationId)}
              style={{
                padding: '12px',
                margin: '4px 0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeConversationId === conversation.conversationId 
                  ? '#e0e7ff' 
                  : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '18px' }}>💬</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>گفتگو {conversations.length - conversations.indexOf(conversation)}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatDate(conversation.createdAt)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 