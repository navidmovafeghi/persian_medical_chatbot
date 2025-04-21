'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Tile.module.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserProfileTile() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  
  // Debug session data
  useEffect(() => {
    console.log("Session in UserProfileTile:", session);
    console.log("Session status:", status);
  }, [session, status]);

  const handleSignOut = async () => {
    // Explicitly set callbackUrl to ensure redirect works properly on Netlify
    await signOut({ 
      callbackUrl: '/',
      redirect: true
    });
    
    // As a fallback, use client-side navigation if the signOut redirect doesn't work
    setTimeout(() => {
      if (status !== 'loading' && !session) {
        router.push('/');
        router.refresh();
      }
    }, 500);
  };

  // Check if the user is authenticated based on session and status
  const isAuthenticated = status === 'authenticated' && session !== null;

  return (
    <div className={styles.tile}>
      <h2>پروفایل کاربر</h2>
      
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : isAuthenticated ? (
        <>
          <p>خوش آمدید{session?.user?.name ? ` ${session.user.name}` : ''}</p>
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