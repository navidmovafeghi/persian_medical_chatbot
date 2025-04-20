'use client';
import { useState } from 'react';
import styles from './Tile.module.css'; // We'll create this later if needed

export default function FrequentQuestionsTile({ onQuestionClick }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
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

  const handleTogglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <>
      <div 
        className={`${styles.tile} ${styles.clickableTile}`} 
        onClick={handleTogglePopup}
      >
        <h2>سوالات متداول</h2>
        <p className={styles.tileDescription}>برای مشاهده همه سوالات کلیک کنید</p>
        <div className={styles.previewQuestions}>
          {frequentQuestions.slice(0, 2).map((question, index) => (
            <div key={index} className={styles.previewQuestion}>
              • {question}
            </div>
          ))}
        </div>
      </div>

      {/* Popup for frequent questions */}
      {isPopupOpen && (
        <div className={styles.popupOverlay} onClick={handleTogglePopup}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h2>سوالات متداول</h2>
              <button className={styles.closePopup} onClick={handleTogglePopup}>×</button>
            </div>
            <div className={styles.popupContent}>
              <ul className={styles.questionsList}>
                {frequentQuestions.map((question, index) => (
                  <li key={index} className={styles.questionItem}>
                    <button 
                      onClick={() => {
                        onQuestionClick?.(question);
                        setIsPopupOpen(false);
                      }}
                      className={styles.questionButton}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 