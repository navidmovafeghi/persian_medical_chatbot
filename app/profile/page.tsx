'use client'; // Assuming client-side interactions later

import { useState, useEffect } from 'react'; // Import useState and useEffect
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css'; // We'll create this if needed

// Define the LaboratoryData type
interface LaboratoryData {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit?: string;
  normalRange?: string;
  notes?: string;
}

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

  // State for laboratory data
  const [laboratoryData, setLaboratoryData] = useState<LaboratoryData[]>([]);
  const [showLabForm, setShowLabForm] = useState(false);
  const [labLoading, setLabLoading] = useState(false);
  const [labMessage, setLabMessage] = useState('');
  
  // New lab test form state
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testUnit, setTestUnit] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [testNotes, setTestNotes] = useState('');

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
  
  // Fetch laboratory data
  useEffect(() => {
    const fetchLaboratoryData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/laboratory');
          
          if (response.ok) {
            const data = await response.json();
            setLaboratoryData(data.laboratoryData || []);
            
            // If there's a message but it's not an error, show it
            if (data.message && !data.error) {
              setLabMessage(data.message);
            }
          } else {
            // Handle error responses
            const errorData = await response.json();
            setLabMessage(`خطا: ${errorData.error || 'خطا در دریافت اطلاعات'}`);
            setLaboratoryData([]);
          }
        } catch (error) {
          console.error('Error fetching laboratory data:', error);
          setLabMessage('خطا در دریافت اطلاعات آزمایشگاهی');
          setLaboratoryData([]);
        }
      }
    };
    
    fetchLaboratoryData();
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
  
  // Handle adding a new laboratory test
  const handleAddLabTest = async () => {
    if (!session?.user?.id) return;
    
    // Validate required fields
    if (!testName || !testDate || !testResult) {
      setLabMessage('نام آزمایش، تاریخ و نتیجه الزامی هستند');
      return;
    }
    
    setLabLoading(true);
    setLabMessage('');
    
    try {
      const response = await fetch('/api/laboratory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testName,
          testDate,
          result: testResult,
          unit: testUnit,
          normalRange,
          notes: testNotes
        }),
      });
      
      if (response.ok) {
        // Reset form fields
        setTestName('');
        setTestDate('');
        setTestResult('');
        setTestUnit('');
        setNormalRange('');
        setTestNotes('');
        
        // Close form
        setShowLabForm(false);
        
        // Refresh laboratory data
        const labResponse = await fetch('/api/laboratory');
        if (labResponse.ok) {
          const data = await labResponse.json();
          setLaboratoryData(data.laboratoryData || []);
          setLabMessage('اطلاعات آزمایشگاهی با موفقیت اضافه شد');
        } else {
          const errorData = await labResponse.json();
          setLabMessage(`خطا: ${errorData.error || 'خطا در دریافت اطلاعات'}`);
        }
      } else {
        const error = await response.json();
        setLabMessage(`خطا: ${error.error || 'خطا در ذخیره‌سازی'}`);
      }
    } catch (error) {
      console.error('Error adding laboratory data:', error);
      setLabMessage('خطا در ذخیره‌سازی اطلاعات آزمایشگاهی');
    } finally {
      setLabLoading(false);
    }
  };
  
  // Handle deleting a laboratory test
  const handleDeleteLabTest = async (id: string) => {
    if (!session?.user?.id) return;
    
    if (!confirm('آیا از حذف این آزمایش اطمینان دارید؟')) {
      return;
    }
    
    setLabLoading(true);
    
    try {
      const response = await fetch('/api/laboratory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (response.ok) {
        // Update the lab data list by filtering out the deleted item
        setLaboratoryData(prev => prev.filter(lab => lab.id !== id));
        setLabMessage('اطلاعات آزمایشگاهی با موفقیت حذف شد');
      } else {
        const error = await response.json();
        setLabMessage(`خطا: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error deleting laboratory data:', error);
      setLabMessage('خطا در حذف اطلاعات آزمایشگاهی');
    } finally {
      setLabLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1>صفحه پروفایل کاربر</h1>
      
      {/* Appointments Button at the top of the profile */}
      <div className={styles.appointmentsButtonContainer}>
        <Link href="/appointments" className={styles.appointmentsButton}>
          مدیریت قرار ملاقات‌های پزشکی
        </Link>
      </div>
      
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
      
      {/* Laboratory Data Section */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <h2>اطلاعات آزمایشگاهی</h2>
          <button 
            className={styles.addButton}
            onClick={() => setShowLabForm(!showLabForm)}
            disabled={labMessage.includes('Laboratory data model not available')}
          >
            {showLabForm ? 'انصراف' : 'افزودن آزمایش جدید'}
          </button>
        </div>
        
        {labMessage && (
          <div className={
            labMessage.startsWith('خطا') || labMessage.includes('not available')
              ? styles.errorMessage 
              : styles.successMessage
          }>
            {labMessage}
          </div>
        )}
        
        {/* Add New Laboratory Test Form */}
        {showLabForm && (
          <div className={styles.labForm}>
            <div className={styles.formGroup}>
              <label htmlFor="testName" className={styles.label}>نام آزمایش:</label>
              <input
                id="testName"
                type="text"
                className={styles.input}
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="مثال: قند خون ناشتا"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="testDate" className={styles.label}>تاریخ آزمایش:</label>
              <input
                id="testDate"
                type="date"
                className={styles.input}
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="testResult" className={styles.label}>نتیجه:</label>
                <input
                  id="testResult"
                  type="text"
                  className={styles.input}
                  value={testResult}
                  onChange={(e) => setTestResult(e.target.value)}
                  placeholder="مثال: 120"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="testUnit" className={styles.label}>واحد اندازه‌گیری:</label>
                <input
                  id="testUnit"
                  type="text"
                  className={styles.input}
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value)}
                  placeholder="مثال: mg/dL"
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="normalRange" className={styles.label}>محدوده طبیعی:</label>
              <input
                id="normalRange"
                type="text"
                className={styles.input}
                value={normalRange}
                onChange={(e) => setNormalRange(e.target.value)}
                placeholder="مثال: 70-110"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="testNotes" className={styles.label}>توضیحات:</label>
              <textarea
                id="testNotes"
                className={styles.textarea}
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                rows={3}
                placeholder="توضیحات اضافی در مورد این آزمایش..."
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <button 
                onClick={handleAddLabTest} 
                className={styles.saveButton}
                disabled={labLoading}
              >
                {labLoading ? 'در حال ذخیره...' : 'ذخیره اطلاعات آزمایش'}
              </button>
              
              <button 
                onClick={() => setShowLabForm(false)} 
                className={styles.cancelButton}
                disabled={labLoading}
              >
                انصراف
              </button>
            </div>
          </div>
        )}
        
        {/* Laboratory Tests List */}
        <div className={styles.labDataContainer}>
          {laboratoryData.length > 0 ? (
            laboratoryData.map((lab) => (
              <div key={lab.id} className={styles.labDataCard}>
                <div className={styles.labDataHeader}>
                  <h3>{lab.testName}</h3>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDeleteLabTest(lab.id)}
                    disabled={labLoading}
                  >
                    حذف
                  </button>
                </div>
                
                <div className={styles.labDataDetails}>
                  <p className={styles.labDate}>
                    <span>تاریخ:</span> {new Date(lab.testDate).toLocaleDateString('fa-IR')}
                  </p>
                  
                  <p className={styles.labResult}>
                    <span>نتیجه:</span> {lab.result} {lab.unit && <span className={styles.unit}>{lab.unit}</span>}
                  </p>
                  
                  {lab.normalRange && (
                    <p className={styles.labNormalRange}>
                      <span>محدوده طبیعی:</span> {lab.normalRange}
                    </p>
                  )}
                  
                  {lab.notes && (
                    <p className={styles.labNotes}>
                      <span>توضیحات:</span> {lab.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noDataMessage}>هیچ اطلاعات آزمایشگاهی ثبت نشده است</p>
          )}
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
      
      {/* Additional appointments link at the bottom */}
      <div className={styles.appointmentLinkContainer}>
        <Link href="/appointments" className={styles.appointmentLink}>
          مشاهده و مدیریت قرارهای ملاقات پزشکی
        </Link>
      </div>
    </div>
  );
} 