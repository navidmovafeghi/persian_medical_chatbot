'use client';
import { useState, useEffect } from 'react';
import UserProfileTile from './UserProfileTile';
import SubscriptionTile from './SubscriptionTile';
import FrequentQuestionsTile from './FrequentQuestionsTile';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ onQuestionClick }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.menuDrawer}`) && 
          !event.target.closest(`.${styles.hamburgerIcon}`)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger icon */}
      <button 
        className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="منو"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {/* Overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}
      
      {/* Menu drawer */}
      <div className={`${styles.menuDrawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerContent}>
          <h2 className={styles.drawerTitle}>منو</h2>
          <UserProfileTile />
          <SubscriptionTile />
          <FrequentQuestionsTile onQuestionClick={(question) => {
            onQuestionClick(question);
            setIsOpen(false);
          }} />
          
          <button 
            className={styles.closeButton} 
            onClick={() => setIsOpen(false)}
          >
            بستن
          </button>
        </div>
      </div>
    </>
  );
} 