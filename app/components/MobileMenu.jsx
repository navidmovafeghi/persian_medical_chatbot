'use client';
import { useState, useEffect } from 'react';
import UserProfileTile from './UserProfileTile';
import SubscriptionTile from './SubscriptionTile';
import FrequentQuestionsTile from './FrequentQuestionsTile';
import styles from './MobileMenu.module.css';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MobileMenu({ onQuestionClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Debug session in mobile menu
  useEffect(() => {
    console.log("Session in MobileMenu:", session);
    console.log("Session status in MobileMenu:", status);
  }, [session, status]);
  
  // Check if the user is authenticated
  const isAuthenticated = status === 'authenticated' && session !== null;
  
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle sign in click
  const handleSignIn = (e) => {
    e.preventDefault();
    signIn();
  };

  // Handle sign out click
  const handleSignOut = (e) => {
    e.preventDefault();
    // Explicitly set callbackUrl to ensure redirect works properly on Netlify
    signOut({ 
      callbackUrl: '/',
      redirect: true
    });
    
    // As a fallback, use client-side navigation if the signOut redirect doesn't work
    setTimeout(() => {
      setIsOpen(false);
      router.push('/');
      router.refresh();
    }, 500);
  };

  // Handle question click
  const handleQuestionClick = (text) => {
    onQuestionClick(text);
    setIsOpen(false); // Close menu after clicking
  };

  return (
    <>
      {/* Top Bar with centered button */}
      <div className={styles.topBar}>
        <button 
          className={styles.menuButton}
          onClick={toggleMenu}
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
                    handleQuestionClick(question);
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
        <div className={styles.overlay} onClick={toggleMenu} />
      )}
      
      {/* Menu drawer */}
      <div className={`${styles.menuDrawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerContent}>
          <h2 className={styles.drawerTitle}>منو</h2>
          
          {/* Navigation Links */}
          <div className={styles.navigationLinks}>
            <Link href="/" className={styles.navLink} onClick={toggleMenu}>
              صفحه اصلی
            </Link>
            
            {isAuthenticated && (
              <>
                <Link href="/profile" className={styles.navLink} onClick={toggleMenu}>
                  پروفایل پزشکی
                </Link>
                
                <Link href="/appointments" className={styles.navLink} onClick={toggleMenu}>
                  قرار ملاقات‌ها
                </Link>
                
                <Link href="/pills" className={styles.navLink} onClick={toggleMenu}>
                  یادآور دارو
                </Link>
              </>
            )}
          </div>
          
          <UserProfileTile />
          <SubscriptionTile />
          <FrequentQuestionsTile onQuestionClick={(question) => {
            handleQuestionClick(question);
            setIsOpen(false);
          }} />
          
          <button 
            className={styles.closeButton} 
            onClick={toggleMenu}
          >
            بستن
          </button>
        </div>
      </div>
    </>
  );
} 