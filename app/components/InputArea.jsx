// app/components/InputArea.jsx
'use client';
import { useRef } from 'react';
import styles from './InputArea.module.css';

export default function InputArea({ value, onChange, onSubmit, disabled }) {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="سوال پزشکی خود را بپرسید..."
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          dir="rtl"
        />
      </div>
      
      <button
        className={styles.sendButton}
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        aria-label="ارسال"
      >
        <span className={styles.sendIcon}>➤</span>
      </button>
    </div>
  );
}