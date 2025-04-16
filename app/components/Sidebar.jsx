// app/components/Sidebar.jsx
'use client';

import { useState } from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [recentChats, setRecentChats] = useState([
    { id: 1, title: 'مشاوره پزشکی اول' },
    { id: 2, title: 'سوالات دارویی' },
    { id: 3, title: 'علائم سرماخوردگی' },
    { id: 4, title: 'مشکلات گوارشی' },
    { id: 5, title: 'توصیه‌های تغذیه‌ای' },
  ]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <h2>چت‌بات پزشکی</h2>
        <p>نسخه ۱.۰</p>
      </div>
      
      <button className={styles.newChatButton}>
        + گفتگوی جدید
      </button>

      <div className={styles.recentSection}>
        <h3>آخرین گفتگوها</h3>
        <ul className={styles.recentChatsList}>
          {recentChats.map(chat => (
            <li key={chat.id} className={styles.recentChatItem}>
              <span className={styles.chatIcon}>📝</span>
              <span>{chat.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bottomMenu}>
        <div className={styles.menuItem}>
          <span className={styles.menuIcon}>❓</span>
          <span>راهنما</span>
        </div>
        <div className={styles.menuItem}>
          <span className={styles.menuIcon}>⚙️</span>
          <span>تنظیمات</span>
        </div>
      </div>
    </aside>
  );
}