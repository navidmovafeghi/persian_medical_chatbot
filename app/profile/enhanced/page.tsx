'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Dashboard from '../dashboard';
import LaboratorySection from '../../components/LaboratorySection';
import styles from '../profile.module.css';

export default function EnhancedProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Set initial active tab based on URL parameter
  useEffect(() => {
    if (tabParam === 'laboratory') {
      setActiveTab('laboratory');
    }
  }, [tabParam]);
  
  // Redirect to login if not authenticated
  if (status === 'loading') {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }
  
  // Don't render anything if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <div className={styles.profileContainer}>
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          داشبورد
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'laboratory' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('laboratory')}
        >
          مدیریت نتایج آزمایشگاهی
        </button>
      </div>
      
      {activeTab === 'dashboard' && (
        <Dashboard />
      )}
      
      {activeTab === 'laboratory' && (
        <div>
          <div className={styles.laboratoryHeader}>
            <h1>مدیریت نتایج آزمایشگاهی</h1>
            <p className={styles.laboratoryIntro}>
              در این بخش می‌توانید نتایج آزمایش‌های خود را مدیریت کنید. می‌توانید اطلاعات را به صورت دستی وارد کنید یا فایل آزمایش خود را آپلود کنید و سیستم به صورت خودکار اطلاعات را استخراج خواهد کرد.
            </p>
          </div>
          
          <LaboratorySection />
          
          <div className={styles.backLink}>
            <Link href="/profile" className={styles.appointmentLink}>
              بازگشت به پروفایل
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 