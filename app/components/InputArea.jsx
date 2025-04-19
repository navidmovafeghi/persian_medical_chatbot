// app/components/InputArea.jsx
'use client';

import styles from './InputArea.module.css';

export default function InputArea({ value, onChange, onSubmit, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={styles.inputArea}>
      {/* <button type="button" className={styles.attachButton} disabled={disabled}>
        📎
      </button> */}
      <input
        type="text"
        className={styles.chatInput}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="پرسش خود را اینجا بنویسید..."
        disabled={disabled}
      />
      <button 
        type="button" 
        className={styles.sendButton}
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
      >
        &#10148; 
      </button>
      {/* Voice button removed */}
    </div>
  );
}