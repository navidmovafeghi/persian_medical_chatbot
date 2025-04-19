'use client'; // Assuming client-side interactions later

import { useState, useEffect } from 'react'; // Import useState and useEffect
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css'; // We'll create this if needed

export default function ProfilePage() {
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
        }
      }
    };
    
    fetchProfile();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setMessage('');
    
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
          height,
          weight,
          dateOfBirth,
          gender,
          emergencyContact
        }),
      });
      
      if (response.ok) {
        setMessage('اطلاعات با موفقیت ذخیره شد');
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

  if (status === 'loading') {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1>صفحه پروفایل کاربر</h1>
      {message && (
        <div className={
          message.startsWith('خطا') 
            ? styles.errorMessage 
            : styles.successMessage
        }>
          {message}
        </div>
      )}
      
      <div className={styles.formSection}>
        <h2>اطلاعات شخصی</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="gender" className={styles.label}>جنسیت:</label>
          <select
            id="gender"
            className={styles.select}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">انتخاب کنید</option>
            <option value="مرد">مرد</option>
            <option value="زن">زن</option>
            <option value="سایر">سایر</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dateOfBirth" className={styles.label}>تاریخ تولد:</label>
          <input
            id="dateOfBirth"
            type="date"
            className={styles.input}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="height" className={styles.label}>قد (سانتی‌متر):</label>
            <input
              id="height"
              type="number"
              className={styles.input}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="مثال: 175"
              step="0.1"
              min="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="weight" className={styles.label}>وزن (کیلوگرم):</label>
            <input
              id="weight"
              type="number"
              className={styles.input}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="مثال: 70"
              step="0.1"
              min="0"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bloodType" className={styles.label}>گروه خونی:</label>
          <select
            id="bloodType"
            className={styles.select}
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
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
          <label htmlFor="emergencyContact" className={styles.label}>
            اطلاعات تماس اضطراری:
          </label>
          <textarea
            id="emergencyContact"
            className={styles.textarea}
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            rows={2}
            placeholder="نام و شماره تماس فرد مورد نظر در مواقع اضطراری"
          />
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2>اطلاعات پزشکی</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="allergies" className={styles.label}>
            حساسیت‌ها و آلرژی‌ها:
          </label>
          <textarea
            id="allergies"
            className={styles.textarea}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            rows={3}
            placeholder="لطفاً حساسیت‌ها و آلرژی‌های خود را وارد کنید..."
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="medicalHistory" className={styles.label}>
            سابقه بیماری‌ها:
          </label>
          <textarea
            id="medicalHistory"
            className={styles.textarea}
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            rows={5}
            placeholder="لطفاً سابقه بیماری‌های خود را وارد کنید..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="drugHistory" className={styles.label}>
            داروهای مصرفی فعلی:
          </label>
          <textarea
            id="drugHistory"
            className={styles.textarea}
            value={drugHistory}
            onChange={(e) => setDrugHistory(e.target.value)}
            rows={5}
            placeholder="لطفاً داروهایی که در حال حاضر مصرف می‌کنید را وارد کنید..."
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button 
          onClick={handleSave} 
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
        </button>
        
        <Link href="/" className={styles.backButton}>
          بازگشت به چت
        </Link>
      </div>
    </div>
  );
} 