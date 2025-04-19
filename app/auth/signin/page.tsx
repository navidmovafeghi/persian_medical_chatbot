'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import styles from './signin.module.css';

export default function SignIn() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      // Register - make a POST request to register API
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'خطا در ثبت نام');
        }
        
        // Sign in after successful registration
        await signIn('credentials', {
          email,
          password,
          redirect: true,
          callbackUrl: '/',
        });
      } catch (error: any) {
        setError(error.message || 'خطا در ثبت نام');
        setLoading(false);
      }
    } else {
      // Login
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        if (result?.error) {
          setError('ایمیل یا رمز عبور اشتباه است.');
          setLoading(false);
        } else {
          router.push('/');
        }
      } catch (error) {
        setError('خطا در ورود به سیستم');
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>
          {isRegister ? 'ثبت نام' : 'ورود به سیستم'}
        </h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
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
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'در حال پردازش...' : isRegister ? 'ثبت نام' : 'ورود'}
          </button>
        </form>
        
        <div className={styles.switchMode}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            className={styles.switchButton}
          >
            {isRegister
              ? 'قبلاً حساب کاربری دارید؟ وارد شوید'
              : 'حساب کاربری ندارید؟ ثبت نام کنید'}
          </button>
        </div>
        
        <div className={styles.backLink}>
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </div>
      </div>
    </div>
  );
} 