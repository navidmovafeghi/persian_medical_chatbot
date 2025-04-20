'use client';
import { useState, useEffect } from 'react';
import UserProfileTile from './UserProfileTile';
import SubscriptionTile from './SubscriptionTile';
import FrequentQuestionsTile from './FrequentQuestionsTile';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ onQuestionClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  
  // Frequent questions data
  const frequentQuestions = [
    "علائم کرونا چیست؟",
    "چگونه فشار خون را کنترل کنم؟",
    "مقدار مصرف داروی استامینوفن",
    "توصیه برای سردرد میگرنی",
    "علائم آنفولانزا کدامند؟",
    "نشانه‌های دیابت چیست؟",
    "چگونه وزن کم کنم؟",
    "درمان سرماخوردگی در خانه",
    "علائم کمبود ویتامین D",
    "داروهای ضد التهاب بدون نسخه",
    "مشکلات گوارشی در بارداری",
    "تغذیه مناسب برای کودکان",
    "راه‌های کاهش استرس و اضطراب",
    "چگونه خواب بهتری داشته باشم؟"
  ];
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.menuDrawer}`) && 
          !event.target.closest(`.${styles.topBar}`)) {
        setIsOpen(false);
      }
      
      if (isQuestionsOpen && 
          !event.target.closest(`.${styles.questionsMenu}`) && 
          !event.target.closest(`.${styles.questionsButton}`)) {
        setIsQuestionsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isQuestionsOpen]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen || isQuestionsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isQuestionsOpen]);

  return (
    <>
      {/* Top Bar with centered button */}
      <div className={styles.topBar}>
        <button 
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="منو"
        >
          ☰
        </button>
      </div>
      
      {/* Frequent Questions Bar with toggle button */}
      <div className={styles.questionsBar}>
        <button 
          className={styles.questionsButton}
          onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
        >
          سوالات متداول
          <span className={isQuestionsOpen ? styles.arrowUp : styles.arrowDown}>▼</span>
        </button>
      </div>
      
      {/* Collapsible Questions Menu */}
      <div className={`${styles.questionsMenu} ${isQuestionsOpen ? styles.open : ''}`}>
        <div className={styles.questionsMenuContent}>
          <h3>سوالات متداول</h3>
          <ul>
            {frequentQuestions.map((question, index) => (
              <li key={index}>
                <button 
                  onClick={() => {
                    onQuestionClick?.(question);
                    setIsQuestionsOpen(false);
                  }}
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Overlay for questions menu */}
      {isQuestionsOpen && (
        <div className={styles.questionsOverlay} onClick={() => setIsQuestionsOpen(false)} />
      )}
      
      {/* Overlay for main menu */}
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