// app/components/InputArea.jsx
'use client';
import { useRef, useState } from 'react';
import styles from './InputArea.module.css';

export default function InputArea({ value, onChange, onSubmit, disabled, onFileUpload }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only accept images and PDFs
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('فقط فایل های تصویر و PDF پذیرفته می‌شود');
      return;
    }

    try {
      setIsUploading(true);
      await onFileUpload(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.inputArea}>
      {/* Lab Results Upload Button */}
      <label className={styles.uploadButton} title="آپلود نتایج آزمایش">
        <input
          type="file"
          ref={fileInputRef}
          className={styles.fileInput}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          disabled={disabled || isUploading}
        />
        <span className={styles.uploadIcon}>📋</span>
      </label>
      
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={isUploading ? "در حال آپلود فایل..." : "سوال پزشکی خود را بپرسید..."}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isUploading}
          dir="rtl"
        />
      </div>
      
      <button
        className={styles.sendButton}
        onClick={onSubmit}
        disabled={!value.trim() || disabled || isUploading}
        aria-label="ارسال"
      >
        <span className={styles.sendIcon}>➤</span>
      </button>
    </div>
  );
}