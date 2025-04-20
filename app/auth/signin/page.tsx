'use client';
import { useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  // Handle mounting state to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register - make a POST request to register API
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
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        if (result?.error) {
          throw new Error(result.error);
        }
        
        router.push('/');
      } else {
        // Login
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        if (result?.error) {
          setError('ایمیل یا رمز عبور اشتباه است.');
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'خطا در اتصال به سرور';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Only render the form when the component has mounted on the client
  if (!mounted) {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }

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
        
        {!isRegister && (
          <div className={styles.forgotPassword}>
            <Link href="/auth/reset-password">
              رمز عبور خود را فراموش کرده‌اید؟
            </Link>
          </div>
        )}
        
        <div className={styles.backLink}>
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </div>
      </div>
    </div>
  );
} 