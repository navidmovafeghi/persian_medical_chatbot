'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../signin/signin.module.css';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('رمزهای عبور مطابقت ندارند');
      return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      setError('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'خطا در بازنشانی رمز عبور');
      }
      
      setSuccess('رمز عبور با موفقیت بازنشانی شد. اکنون می‌توانید وارد شوید.');
      
      // Clear form
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
      
    } catch (error: any) {
      const errorMessage = error?.message || 'خطا در اتصال به سرور';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>بازنشانی رمز عبور</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">ایمیل</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">رمز عبور جدید</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={styles.input}
              minLength={6}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">تکرار رمز عبور جدید</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'در حال پردازش...' : 'بازنشانی رمز عبور'}
          </button>
        </form>
        
        <div className={styles.backLink}>
          <Link href="/auth/signin">بازگشت به صفحه ورود</Link>
        </div>
      </div>
    </div>
  );
} 