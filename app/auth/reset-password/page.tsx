'use client';
import { useState, useEffect } from 'react';
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
  const [debug, setDebug] = useState<any>(null);
  const [useAlternative, setUseAlternative] = useState(false);
  const [resetAttempts, setResetAttempts] = useState(0);

  useEffect(() => {
    // Log any errors to the console
    if (error) {
      console.error('Password reset error:', error);
    }
    if (debug) {
      console.log('Debug information:', debug);
    }
  }, [error, debug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebug(null);
    
    console.log('Starting password reset process');
    console.log('Using alternative method:', useAlternative);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      setError('رمزهای عبور مطابقت ندارند');
      return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      console.log('Password too short');
      setError('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }
    
    setLoading(true);
    console.log('Sending password reset request');

    try {
      // First check if the user exists
      const checkResponse = await fetch('/api/auth/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const checkData = await checkResponse.json();
      console.log('User check response:', checkData);
      
      // Store debug info
      setDebug(checkData);
      
      if (!checkResponse.ok && checkData.error === 'User not found') {
        throw new Error('کاربری با این ایمیل یافت نشد');
      }

      // Try password reset with appropriate method
      const endpoint = useAlternative 
        ? '/api/auth/direct-reset' 
        : '/api/auth/reset-password';
        
      console.log(`Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      
      console.log('Reset response status:', response.status);
      const data = await response.json();
      console.log('Reset response data:', data);
      
      if (!response.ok) {
        // If this is the first attempt with standard method, try alternative
        if (!useAlternative && resetAttempts === 0) {
          console.log('Standard method failed, switching to alternative method');
          setUseAlternative(true);
          setResetAttempts(prev => prev + 1);
          throw new Error('روش استاندارد با خطا مواجه شد، در حال تلاش با روش جایگزین...');
        }
        
        throw new Error(data.error || data.details || 'خطا در بازنشانی رمز عبور');
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
      console.error('Password reset error:', error);
      
      // If we're switching methods, don't show error to user yet
      if (errorMessage === 'روش استاندارد با خطا مواجه شد، در حال تلاش با روش جایگزین...') {
        setError('در حال تلاش با روش جایگزین...');
        setTimeout(() => {
          handleSubmit(e);
        }, 1000);
      } else {
        setError(errorMessage);
      }
    } finally {
      if (!useAlternative || resetAttempts > 1) {
        setLoading(false);
      }
    }
  };

  const toggleMethod = () => {
    setUseAlternative(prev => !prev);
    setError('');
    setDebug(null);
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
        
        <div className={styles.methodToggle}>
          <button
            onClick={toggleMethod}
            className={styles.switchButton}
            disabled={loading}
          >
            {useAlternative
              ? 'استفاده از روش استاندارد'
              : 'استفاده از روش جایگزین (اگر روش استاندارد کار نمی‌کند)'}
          </button>
        </div>
        
        <div className={styles.backLink}>
          <Link href="/auth/signin">بازگشت به صفحه ورود</Link>
        </div>
        
        {debug && (
          <div className={styles.debugInfo}>
            <details>
              <summary>اطلاعات عیب‌یابی (برای توسعه‌دهندگان)</summary>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 