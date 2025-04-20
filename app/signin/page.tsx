'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Kalameh, Vazir, Tahoma, sans-serif'
    }}>
      <p>درحال انتقال به صفحه ورود...</p>
    </div>
  );
} 