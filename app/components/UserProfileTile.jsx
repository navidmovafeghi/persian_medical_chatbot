'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Tile.module.css';

export default function UserProfileTile() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className={styles.tile}>
      <h2>پروفایل کاربر</h2>
      
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : session ? (
        <>
          <p>خوش آمدید{session.user.name ? ` ${session.user.name}` : ''}</p>
          <div className={styles.actions}>
            <Link href="/profile" className={styles.actionLink}>
              مشاهده پروفایل
            </Link>
            <button onClick={handleSignOut} className={styles.tileButton}>
              خروج
            </button>
          </div>
        </>
      ) : (
        <>
          <p>شما وارد نشده‌اید</p>
          <Link href="/auth/signin" className={styles.tileLink}>
            <button className={styles.tileButton}>
              ورود / ثبت نام
            </button>
          </Link>
        </>
      )}
    </div>
  );
} 