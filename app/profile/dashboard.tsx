'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';
import profileStyles from './profile.module.css';

// Define types
interface LaboratoryData {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit?: string;
  normalRange?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  doctorName: string;
  status: string;
  duration: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  createdAt: string;
}

interface ProfileData {
  medicalHistory?: string;
  drugHistory?: string;
  allergies?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  
  // State for profile data
  const [profileData, setProfileData] = useState<ProfileData>({});
  
  // State for laboratory data
  const [laboratoryData, setLaboratoryData] = useState<LaboratoryData[]>([]);
  
  // State for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // State for chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // State for loading indicators
  const [loading, setLoading] = useState({
    profile: true,
    appointments: true,
    laboratory: true,
    chat: true
  });
  
  // State for error messages
  const [errors, setErrors] = useState({
    profile: '',
    appointments: '',
    laboratory: '',
    chat: ''
  });
  
  // Active tab state for mobile view
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/profile');
          
          if (response.ok) {
            const data = await response.json();
            setProfileData({
              medicalHistory: data.medicalHistory || '',
              drugHistory: data.drugHistory || '',
              allergies: data.allergies || '',
              bloodType: data.bloodType || '',
              height: data.height || '',
              weight: data.weight || '',
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
              gender: data.gender || '',
              emergencyContact: data.emergencyContact || ''
            });
          } else {
            throw new Error('Failed to fetch profile data');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setErrors(prev => ({ ...prev, profile: 'خطا در دریافت اطلاعات پروفایل' }));
        } finally {
          setLoading(prev => ({ ...prev, profile: false }));
        }
      }
    };
    
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);
  
  // Fetch laboratory data
  useEffect(() => {
    const fetchLaboratoryData = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/laboratory');
          
          if (response.ok) {
            const data = await response.json();
            setLaboratoryData(data.laboratoryData || []);
          } else {
            throw new Error('Failed to fetch laboratory data');
          }
        } catch (error) {
          console.error('Error fetching laboratory data:', error);
          setErrors(prev => ({ ...prev, laboratory: 'خطا در دریافت اطلاعات آزمایشگاهی' }));
        } finally {
          setLoading(prev => ({ ...prev, laboratory: false }));
        }
      }
    };
    
    if (isAuthenticated) {
      fetchLaboratoryData();
    }
  }, [isAuthenticated]);
  
  // Fetch appointments data
  useEffect(() => {
    const fetchAppointments = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/appointments');
          
          if (response.ok) {
            const data = await response.json();
            setAppointments(data.appointments || []);
          } else {
            throw new Error('Failed to fetch appointments');
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setErrors(prev => ({ ...prev, appointments: 'خطا در دریافت قرار ملاقات‌ها' }));
        } finally {
          setLoading(prev => ({ ...prev, appointments: false }));
        }
      }
    };
    
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);
  
  // Fetch chat messages
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/chat/history');
          
          if (response.ok) {
            const data = await response.json();
            setChatMessages(data.messages || []);
          } else {
            throw new Error('Failed to fetch chat messages');
          }
        } catch (error) {
          console.error('Error fetching chat messages:', error);
          setErrors(prev => ({ ...prev, chat: 'خطا در دریافت پیام‌های چت' }));
        } finally {
          setLoading(prev => ({ ...prev, chat: false }));
        }
      }
    };
    
    // Mock chat messages for now since we may not have a complete chat history API
    setChatMessages([
      { id: '1', text: 'من مشکل سردرد میگرنی دارم، چه دارویی مناسب است؟', sender: 'user', createdAt: '2023-05-10T12:30:00' },
      { id: '2', text: 'سردردهای میگرنی معمولاً با داروهای ضد التهاب غیراستروئیدی (NSAID) مانند ایبوپروفن یا استامینوفن قابل کنترل هستند. برای موارد شدیدتر، پزشک ممکن است تریپتان‌ها را تجویز کند. علاوه بر دارو، استراحت در اتاق تاریک و آرام و کمپرس سرد روی پیشانی هم می‌تواند کمک کننده باشد.', sender: 'bot', createdAt: '2023-05-10T12:31:00' },
    ]);
    setLoading(prev => ({ ...prev, chat: false }));
    
    // If you have a chat history API, uncomment this:
    // if (isAuthenticated) {
    //   fetchChatMessages();
    // }
  }, [isAuthenticated]);

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className={profileStyles.loading}>در حال بارگذاری...</div>
    );
  }

  // Handle unauthenticated state
  if (status === 'unauthenticated') {
    return null; // We already redirect in useEffect
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
  });
  
  // Get upcoming appointments
  const upcomingAppointments = sortedAppointments.filter(
    appointment => new Date(appointment.dateTime) > new Date() && appointment.status !== 'cancelled'
  );
  
  // Sort laboratory data by date (most recent first)
  const sortedLabData = [...laboratoryData].sort((a, b) => {
    return new Date(b.testDate).getTime() - new Date(a.testDate).getTime();
  });
  
  // Sort chat messages by date (most recent first)
  const sortedChatMessages = [...chatMessages].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>داشبورد پزشکی</h1>
          <p className={styles.welcome}>
            خوش آمدید{session?.user?.name ? ` ${session.user.name}` : ''} |
            <span className={styles.userEmail}> {session?.user?.email}</span>
          </p>
        </div>
        <div className={styles.actionsContainer}>
          <Link href="/" className={`${styles.actionButton} ${styles.chatButton}`}>
            <span className={styles.appointmentIcon}>💬</span>
            چت با پزشک هوشمند
          </Link>
          <Link href="/appointments" className={`${styles.actionButton} ${styles.appointmentsButton}`}>
            <span className={styles.appointmentIcon}>📅</span>
            مدیریت قرار ملاقات‌ها
          </Link>
          <Link href="/profile/edit" className={styles.actionButton}>
            ویرایش پروفایل
          </Link>
        </div>
      </div>
      
      {/* Mobile tabs */}
      <div className={styles.tabContainer}>
        <div className={styles.tabButtons}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            نمای کلی
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'appointments' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            قرار ملاقات‌ها
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'laboratory' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('laboratory')}
          >
            نتایج آزمایش
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'chat' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            چت پزشکی
          </button>
        </div>
      </div>
      
      {/* Dashboard grid */}
      <div className={`${styles.dashboardGrid} ${styles[activeTab === 'overview' ? 'activeTab' : 'tabContent']}`}>
        {/* Health Stats Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>👤</span>
              اطلاعات سلامت
            </h2>
            <Link href="/profile/edit" className={styles.seeAllLink}>
              ویرایش ↗
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.profile ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.profile ? (
              <div className={styles.emptyState}>{errors.profile}</div>
            ) : (
              <>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>گروه خونی:</span>
                  <span className={styles.statValue}>{profileData.bloodType || 'ثبت نشده'}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>قد:</span>
                  <span className={styles.statValue}>{profileData.height ? `${profileData.height} سانتی‌متر` : 'ثبت نشده'}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>وزن:</span>
                  <span className={styles.statValue}>{profileData.weight ? `${profileData.weight} کیلوگرم` : 'ثبت نشده'}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>تاریخ تولد:</span>
                  <span className={styles.statValue}>
                    {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'ثبت نشده'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>جنسیت:</span>
                  <span className={styles.statValue}>{profileData.gender || 'ثبت نشده'}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Upcoming Appointments Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📅</span>
              قرار ملاقات‌های آینده
            </h2>
            <Link href="/" className={styles.seeAllLink}>
              چت با پزشک هوشمند ↗
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.appointments ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.appointments ? (
              <div className={styles.emptyState}>{errors.appointments}</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className={styles.emptyState}>
                قرار ملاقات آینده‌ای ندارید
                <br />
                <Link href="/appointments" className={styles.emptyStateButton}>
                  رزرو قرار ملاقات
                </Link>
              </div>
            ) : (
              <ul className={styles.appointmentList}>
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <li key={appointment.id} className={styles.appointmentItem}>
                    <div className={styles.appointmentTitle}>{appointment.title}</div>
                    <div className={styles.appointmentDate}>
                      📅 {formatDate(appointment.dateTime)}
                    </div>
                    <div>دکتر {appointment.doctorName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Recent Laboratory Results Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🔬</span>
              آخرین نتایج آزمایش
            </h2>
            <Link href="/profile/enhanced?tab=laboratory" className={styles.seeAllLink}>
              مدیریت و آپلود ↗
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.laboratory ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.laboratory ? (
              <div className={styles.emptyState}>{errors.laboratory}</div>
            ) : sortedLabData.length === 0 ? (
              <div className={styles.emptyState}>
                نتیجه آزمایشی ثبت نشده است
                <br />
                <Link href="/profile#laboratory" className={styles.emptyStateButton}>
                  ثبت نتیجه آزمایش
                </Link>
              </div>
            ) : (
              <ul className={styles.labResultList}>
                {sortedLabData.slice(0, 3).map((lab) => (
                  <li key={lab.id} className={styles.labResultItem}>
                    <div>
                      <div className={styles.labResultName}>{lab.testName}</div>
                      <div className={styles.labResultDate}>{formatDate(lab.testDate)}</div>
                    </div>
                    <div className={styles.labResultValue}>
                      {lab.result} {lab.unit}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Recent Chat Messages Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>💬</span>
              چت اخیر پزشکی
            </h2>
            <Link href="/" className={styles.seeAllLink}>
              چت جدید ↗
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.chat ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.chat ? (
              <div className={styles.emptyState}>{errors.chat}</div>
            ) : sortedChatMessages.length === 0 ? (
              <div className={styles.emptyState}>
                تاریخچه چتی وجود ندارد
                <br />
                <Link href="/" className={styles.emptyStateButton}>
                  شروع چت جدید
                </Link>
              </div>
            ) : (
              <div className={styles.chatMessagesList}>
                {sortedChatMessages.slice(0, 3).map((message) => (
                  <div 
                    key={message.id} 
                    className={`${styles.chatMessage} ${message.sender === 'user' ? styles.chatMessageUser : styles.chatMessageBot}`}
                  >
                    <div className={styles.messageSender}>
                      {message.sender === 'user' ? 'شما' : 'پزشک هوشمند'}
                    </div>
                    <div className={styles.messageText}>
                      {message.text.length > 100 ? `${message.text.substring(0, 100)}...` : message.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Appointments Tab Content */}
      <div className={`${styles.tabContent} ${activeTab === 'appointments' ? styles.activeTab : ''}`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📅</span>
              قرار ملاقات‌های پزشکی
            </h2>
            <Link href="/" className={`${styles.actionButton} ${styles.chatButton}`}>
              چت با پزشک هوشمند
            </Link>
          </div>
          
          <div className={styles.appointmentManagement}>
            <div className={styles.appointmentManagementContent}>
              <h3>مدیریت قرار ملاقات‌های پزشکی</h3>
              <p>در این بخش می‌توانید قرار ملاقات‌های پزشکی خود را مشاهده کنید.</p>
            </div>
          </div>
          
          <div className={styles.cardBody}>
            {loading.appointments ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.appointments ? (
              <div className={styles.emptyState}>{errors.appointments}</div>
            ) : sortedAppointments.length === 0 ? (
              <div className={styles.emptyState}>
                قرار ملاقاتی ثبت نشده است
                <br />
                <Link href="/appointments" className={styles.emptyStateButton}>
                  رزرو قرار ملاقات
                </Link>
              </div>
            ) : (
              <ul className={styles.appointmentList}>
                {sortedAppointments.map((appointment) => (
                  <li key={appointment.id} className={styles.appointmentItem}>
                    <div className={styles.appointmentTitle}>{appointment.title}</div>
                    <div className={styles.appointmentDate}>
                      📅 {formatDate(appointment.dateTime)}
                      <span>مدت: {appointment.duration} دقیقه</span>
                    </div>
                    <div>دکتر {appointment.doctorName}</div>
                    <div>وضعیت: {appointment.status}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Laboratory Tab Content */}
      <div className={`${styles.tabContent} ${activeTab === 'laboratory' ? styles.activeTab : ''}`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>نتایج آزمایشگاهی</h2>
            <Link href="/profile#laboratory" className={styles.actionButton}>
              ثبت نتیجه جدید
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.laboratory ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.laboratory ? (
              <div className={styles.emptyState}>{errors.laboratory}</div>
            ) : sortedLabData.length === 0 ? (
              <div className={styles.emptyState}>
                نتیجه آزمایشی ثبت نشده است
                <br />
                <Link href="/profile#laboratory" className={styles.emptyStateButton}>
                  ثبت نتیجه آزمایش
                </Link>
              </div>
            ) : (
              <ul className={styles.labResultList}>
                {sortedLabData.map((lab) => (
                  <li key={lab.id} className={styles.labResultItem}>
                    <div>
                      <div className={styles.labResultName}>{lab.testName}</div>
                      <div className={styles.labResultDate}>{formatDate(lab.testDate)}</div>
                      {lab.notes && <div>{lab.notes}</div>}
                    </div>
                    <div className={styles.labResultValue}>
                      {lab.result} {lab.unit}
                      {lab.normalRange && <div>محدوده نرمال: {lab.normalRange}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Tab Content */}
      <div className={`${styles.tabContent} ${activeTab === 'chat' ? styles.activeTab : ''}`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>تاریخچه چت پزشکی</h2>
            <Link href="/" className={styles.actionButton}>
              چت جدید
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loading.chat ? (
              <div className={styles.emptyState}>در حال بارگذاری...</div>
            ) : errors.chat ? (
              <div className={styles.emptyState}>{errors.chat}</div>
            ) : sortedChatMessages.length === 0 ? (
              <div className={styles.emptyState}>
                تاریخچه چتی وجود ندارد
                <br />
                <Link href="/" className={styles.emptyStateButton}>
                  شروع چت جدید
                </Link>
              </div>
            ) : (
              <div className={styles.chatMessagesList}>
                {sortedChatMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`${styles.chatMessage} ${message.sender === 'user' ? styles.chatMessageUser : styles.chatMessageBot}`}
                  >
                    <div className={styles.messageSender}>
                      {message.sender === 'user' ? 'شما' : 'پزشک هوشمند'} - {formatDate(message.createdAt)}
                    </div>
                    <div className={styles.messageText}>{message.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Button at bottom */}
      <div className={profileStyles.backLink}>
        <Link href="/" className={`${profileStyles.appointmentLink} ${profileStyles.appointmentLinkHighlight}`}>
          چت با پزشک هوشمند
        </Link>
        <Link href="/profile/edit" className={profileStyles.appointmentLink}>
          ویرایش اطلاعات پروفایل
        </Link>
      </div>
    </div>
  );
} 