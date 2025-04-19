'use client';
import styles from './Tile.module.css'; // We'll create this later if needed

export default function FrequentQuestionsTile({ onQuestionClick }) {
  const frequentQuestions = [
    "علائم کرونا چیست؟",
    "چگونه فشار خون را کنترل کنم؟",
    "مقدار مصرف داروی استامینوفن",
    "توصیه برای سردرد میگرنی"
  ];

  return (
    <div className={styles.tile}>
      <h2>سوالات متداول</h2>
      <ul className={styles.questionsList}>
        {frequentQuestions.map((question, index) => (
          <li key={index} className={styles.questionItem}>
            <button 
              onClick={() => onQuestionClick?.(question)}
              className={styles.questionButton}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 