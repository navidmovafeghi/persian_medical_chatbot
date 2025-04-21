'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import styles from '../profile/profile.module.css';

// Interface for the laboratory data
interface LaboratoryData {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit?: string;
  normalRange?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TestData {
  testName: string;
  dates: string[];
  values: number[];
  unit?: string;
}

interface LabResultsChartProps {
  laboratoryData: LaboratoryData[];
}

export default function LabResultsChart({ laboratoryData }: LabResultsChartProps) {
  const [selectedTest, setSelectedTest] = useState<string>('');

  // Define formatDate function before using it in the useMemo hook
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR');
    } catch (e) {
      return dateString;
    }
  };

  // Process laboratory data for charting
  const { availableTests, chartData } = useMemo(() => {
    // Group lab results by test name
    const testGroups: { [key: string]: TestData } = {};
    
    laboratoryData.forEach(lab => {
      // Skip if can't convert result to number
      const numericResult = parseFloat(lab.result);
      if (isNaN(numericResult)) return;
      
      const testName = lab.testName;
      
      if (!testGroups[testName]) {
        testGroups[testName] = {
          testName,
          dates: [],
          values: [],
          unit: lab.unit
        };
      }
      
      // Add this result
      testGroups[testName].dates.push(lab.testDate);
      testGroups[testName].values.push(numericResult);
    });
    
    // Get list of available tests for the selector
    const availableTests = Object.keys(testGroups);
    
    // Format data for chart based on selected test
    let chartData: any[] = [];
    
    if (selectedTest && testGroups[selectedTest]) {
      const testData = testGroups[selectedTest];
      
      // Convert to chart data format
      chartData = testData.dates.map((date, index) => ({
        date: formatDate(date),
        value: testData.values[index]
      }));
      
      // Sort by date
      chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    return { availableTests, chartData };
  }, [laboratoryData, selectedTest]);

  // Set the first test as selected by default if none is selected
  if (availableTests.length > 0 && selectedTest === '') {
    setSelectedTest(availableTests[0]);
  }
  
  // Get the unit for the selected test
  const selectedUnit = useMemo(() => {
    if (!selectedTest) return '';
    
    const testData = laboratoryData.find(lab => lab.testName === selectedTest);
    return testData?.unit || '';
  }, [selectedTest, laboratoryData]);

  // Return if no data is available
  if (availableTests.length === 0) {
    return (
      <div className={styles.emptyChartState}>
        <p>داده‌های کافی برای نمایش نمودار وجود ندارد.</p>
        <p>لطفا حداقل دو نتیجه از یک آزمایش خاص وارد کنید.</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>نمودار روند نتایج آزمایش</h3>
        <div className={styles.chartControls}>
          <label htmlFor="test-selector">انتخاب آزمایش:</label>
          <select 
            id="test-selector"
            value={selectedTest || ''} 
            onChange={(e) => setSelectedTest(e.target.value)}
            className={styles.chartSelect}
          >
            {availableTests.map(test => (
              <option key={test} value={test}>{test}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              label={{ 
                value: selectedUnit, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }} 
            />
            <Tooltip formatter={(value) => [`${value} ${selectedUnit}`, `مقدار`]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              name={selectedTest}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 