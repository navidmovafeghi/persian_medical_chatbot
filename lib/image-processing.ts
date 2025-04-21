import { createWorker } from 'tesseract.js';

interface LabResult {
  testName: string;
  result: string;
  unit?: string;
  normalRange?: string;
  testDate?: string;
}

// Common lab tests in Persian and English
const commonLabTests = [
  // Blood sugar
  { key: 'FBS', variations: ['FBS', 'قند خون ناشتا', 'قند ناشتا', 'fasting blood sugar'] },
  { key: 'BS', variations: ['BS', 'قند خون', 'blood sugar', 'گلوکز', 'glucose'] },
  { key: 'HbA1c', variations: ['HbA1c', 'هموگلوبین A1c', 'A1c', 'قند سه ماهه'] },
  // Lipids
  { key: 'Cholesterol', variations: ['cholesterol', 'کلسترول', 'کلسترول تام'] },
  { key: 'TG', variations: ['TG', 'triglycerides', 'تری گلیسرید'] },
  { key: 'HDL', variations: ['HDL', 'اچ دی ال'] },
  { key: 'LDL', variations: ['LDL', 'ال دی ال'] },
  // CBC
  { key: 'WBC', variations: ['WBC', 'گلبول سفید', 'white blood cell'] },
  { key: 'RBC', variations: ['RBC', 'گلبول قرمز', 'red blood cell'] },
  { key: 'Hb', variations: ['Hb', 'هموگلوبین', 'hemoglobin'] },
  { key: 'Plt', variations: ['Plt', 'platelets', 'پلاکت'] },
  // Liver
  { key: 'AST', variations: ['AST', 'SGOT', 'آنزیم کبدی'] },
  { key: 'ALT', variations: ['ALT', 'SGPT', 'آنزیم کبدی'] },
  { key: 'ALP', variations: ['ALP', 'آلکالین فسفاتاز'] },
  // Kidney
  { key: 'Cr', variations: ['Cr', 'creatinine', 'کراتینین'] },
  { key: 'BUN', variations: ['BUN', 'اوره خون'] },
  // Electrolytes
  { key: 'Na', variations: ['Na', 'sodium', 'سدیم'] },
  { key: 'K', variations: ['K', 'potassium', 'پتاسیم'] },
  { key: 'Ca', variations: ['Ca', 'calcium', 'کلسیم'] },
];

/**
 * Extracts lab results from an image using OCR
 * @param imageBuffer The image buffer to process
 * @returns Array of extracted lab results
 */
export async function extractLabResultsFromImage(imageBuffer: Buffer): Promise<LabResult[]> {
  try {
    const worker = await createWorker({
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`),
    });
    
    // Set worker options and initialize
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.:/,()[]%',
      tessedit_ocr_engine_mode: 3, // Fully automatic page segmentation
      preserve_interword_spaces: '1',
      tessjs_create_pdf: '0',
      tessjs_create_hocr: '0',
      lang: 'eng+fas',
    });
    
    // Recognize text from image
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    const extractedText = data.text;
    console.log('Extracted text:', extractedText);
    
    return parseLabResults(extractedText);
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Parses text to extract lab test results
 * @param text The text to parse
 * @returns Array of extracted lab results
 */
function parseLabResults(text: string): LabResult[] {
  const results: LabResult[] = [];
  
  // Pattern to match lab results like "قند خون: 120" or "FBS: 120 mg/dl"
  const labPattern = new RegExp(
    `(${commonLabTests.flatMap(test => test.variations).join('|')})\\s*(?::|=|\\s+|است\\s+|برابر\\s+)(\\d+(?:\\.\\d+)?)\\s*(mg\\/dl|mmol\\/l|g\\/dl|\\w+)?`, 
    'gi'
  );
  
  // Execute the pattern matching
  let match;
  while ((match = labPattern.exec(text)) !== null) {
    const [_, testRaw, resultValue, unit] = match;
    
    // Normalize test name
    const testName = commonLabTests.find(test => 
      test.variations.some(v => v.toLowerCase() === testRaw.toLowerCase())
    )?.key || testRaw;
    
    results.push({
      testName,
      result: resultValue,
      unit: unit || undefined
    });
  }
  
  // If no results found with the specific pattern, try more generic patterns
  if (results.length === 0) {
    // Try to match common lab test abbreviations specifically
    // This pattern is more flexible and will catch formats like "TEST_NAME VALUE" or "TEST_NAME = VALUE"
    const flexiblePattern = /\b([A-Za-z][A-Za-z0-9\-\.]{0,9})[:\s=]+([0-9\.]+|\*+)/gi;
    const matches = [...text.matchAll(flexiblePattern)];
    
    for (const match of matches) {
      const [_, testName, result] = match;
      
      // Skip likely false positives (too short or starting with number)
      if (testName.length < 2 || /^[0-9]/.test(testName)) {
        continue;
      }
      
      // Check if this might be a lab test by comparing with common tests
      const isLikelyLabTest = commonLabTests.some(test => 
        test.variations.some(v => 
          v.toLowerCase().includes(testName.toLowerCase()) || 
          testName.toLowerCase().includes(v.toLowerCase())
        )
      );
      
      if (isLikelyLabTest) {
        // Find the best match for normalization
        const bestMatch = commonLabTests.find(test => 
          test.variations.some(v => 
            v.toLowerCase().includes(testName.toLowerCase()) || 
            testName.toLowerCase().includes(v.toLowerCase())
          )
        );
        
        results.push({
          testName: bestMatch?.key || testName,
          result: result,
          unit: undefined
        });
      }
    }
  }
  
  // Try to extract normal ranges
  extractNormalRanges(text, results);
  
  // Try to extract test date
  const datePattern = /تاریخ(?:\s*آزمایش)?:?\s*(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}|\d{1,2}\s+(?:فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)\s+\d{4})/i;
  const dateMatch = text.match(datePattern);
  
  if (dateMatch && dateMatch[1]) {
    const testDate = dateMatch[1];
    // Add the date to all results
    results.forEach(result => {
      result.testDate = testDate;
    });
  }
  
  return results;
}

/**
 * Extracts normal ranges for lab tests
 * @param text The full text to search in
 * @param results The current lab results to update
 */
function extractNormalRanges(text: string, results: LabResult[]): void {
  // For each result, look for its normal range
  results.forEach(result => {
    const testVariations = commonLabTests.find(test => test.key === result.testName)?.variations || [result.testName];
    
    // Try different patterns to find normal ranges
    for (const variation of testVariations) {
      // Pattern like "Normal range: 70-100" or "Reference: 70-100"
      const normalRangePattern = new RegExp(
        `${variation}\\s*(?:.*?)(?:normal range|reference|محدوده نرمال|رنج نرمال|محدوده مرجع):?\\s*(\\d+(?:\\.\\d+)?\\s*-\\s*\\d+(?:\\.\\d+)?)`, 
        'i'
      );
      
      const rangeMatch = text.match(normalRangePattern);
      if (rangeMatch && rangeMatch[1]) {
        result.normalRange = rangeMatch[1];
        break;
      }
    }
  });
} 