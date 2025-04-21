'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../profile.module.css';

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for form inputs
  const [medicalHistory, setMedicalHistory] = useState('');
  const [drugHistory, setDrugHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch existing profile data when session is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile');
          
          if (response.ok) {
            const data = await response.json();
            setMedicalHistory(data.medicalHistory || '');
            setDrugHistory(data.drugHistory || '');
            setAllergies(data.allergies || '');
            setBloodType(data.bloodType || '');
            setHeight(data.height?.toString() || '');
            setWeight(data.weight?.toString() || '');
            setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '');
            setGender(data.gender || '');
            setEmergencyContact(data.emergencyContact || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setMessage('خطا در دریافت اطلاعات پروفایل');
        }
      }
    };
    
    fetchProfile();
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    setLoading(true);
    setMessage('');
    setIsSuccess(false);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalHistory,
          drugHistory,
          allergies,
          bloodType,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          dateOfBirth,
          gender,
          emergencyContact
        }),
      });
      
      if (response.ok) {
        setMessage('اطلاعات با موفقیت ذخیره شد');
        setIsSuccess(true);
        
        // Redirect back to profile page after 2 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(`خطا: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('خطا در ذخیره‌سازی اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }

  // Don't render anything if not authenticated (redirect happens in useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={styles.profileContainer}>
      <h1>ویرایش پروفایل پزشکی</h1>
      
      {message && (
        <div className={isSuccess ? styles.successMessage : styles.errorMessage}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSave}>
        <div className={styles.formSection}>
          <h2>اطلاعات فردی</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="dateOfBirth" className={styles.label}>تاریخ تولد</label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="gender" className={styles.label}>جنسیت</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={styles.select}
              >
                <option value="">انتخاب کنید</option>
                <option value="مرد">مرد</option>
                <option value="زن">زن</option>
                <option value="سایر">سایر</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="height" className={styles.label}>قد (سانتی‌متر)</label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={styles.input}
                step="0.1"
                min="0"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="weight" className={styles.label}>وزن (کیلوگرم)</label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={styles.input}
                step="0.1"
                min="0"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bloodType" className={styles.label}>گروه خونی</label>
            <select
              id="bloodType"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className={styles.select}
            >
              <option value="">انتخاب کنید</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="emergencyContact" className={styles.label}>اطلاعات تماس اضطراری</label>
            <input
              id="emergencyContact"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={styles.input}
              placeholder="نام و شماره تماس فرد برای تماس در مواقع اضطراری"
            />
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h2>سوابق پزشکی</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="medicalHistory" className={styles.label}>سابقه پزشکی</label>
            <textarea
              id="medicalHistory"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              className={styles.textarea}
              placeholder="بیماری‌های قبلی، جراحی‌ها، و سایر سوابق پزشکی را وارد کنید"
            ></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="drugHistory" className={styles.label}>سابقه دارویی</label>
            <textarea
              id="drugHistory"
              value={drugHistory}
              onChange={(e) => setDrugHistory(e.target.value)}
              className={styles.textarea}
              placeholder="داروهایی که در حال حاضر مصرف می‌کنید یا سابقه مصرف آنها را دارید"
            ></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="allergies" className={styles.label}>حساسیت‌ها و آلرژی‌ها</label>
            <textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className={styles.textarea}
              placeholder="حساسیت‌های دارویی، غذایی و محیطی خود را وارد کنید"
            ></textarea>
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? 'در حال ذخیره‌سازی...' : 'ذخیره اطلاعات'}
          </button>
          
          <Link href="/profile" className={styles.backButton}>
            بازگشت به پروفایل
          </Link>
        </div>
      </form>
    </div>
  );
} 