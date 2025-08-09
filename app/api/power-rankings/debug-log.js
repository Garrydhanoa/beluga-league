/**
 * Debug Logger for Power Rankings API
 * This utility helps trace issues in production on Vercel
 */

// Set to true to enable verbose logging on Vercel
const ENABLE_DEBUG_LOGGING = true;

/**
 * Logs debug information based on environment
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log
 */
export function debugLog(message, data = null) {
  // Only log in development or if explicitly enabled on Vercel
  if (process.env.NODE_ENV === 'development' || (process.env.VERCEL && ENABLE_DEBUG_LOGGING)) {
    const timestamp = new Date().toISOString();
    const env = process.env.VERCEL ? 'VERCEL' : 'DEV';
    
    // Format the log message
    const logEntry = {
      timestamp,
      env,
      message,
      ...(data && { data: sanitizeData(data) })
    };
    
    console.log(`[POWER-RANKINGS-DEBUG] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Logs an error with stack trace
 * @param {string} message - Error message
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
export function debugLogError(message, error, context = {}) {
  if (process.env.NODE_ENV === 'development' || (process.env.VERCEL && ENABLE_DEBUG_LOGGING)) {
    const timestamp = new Date().toISOString();
    const env = process.env.VERCEL ? 'VERCEL' : 'DEV';
    
    // Format the error log
    const logEntry = {
      timestamp,
      env,
      type: 'ERROR',
      message,
      errorMessage: error?.message || 'Unknown error',
      stack: error?.stack ? error.stack.split('\n').slice(0, 5).join('\n') : null,
      context: sanitizeData(context)
    };
    
    console.error(`[POWER-RANKINGS-ERROR] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Removes sensitive information from objects before logging
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data) {
  if (!data) return null;
  if (typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Sanitize sensitive keys
  const sensitiveKeys = [
    'privateKey', 'private_key', 'GOOGLE_PRIVATE_KEY', 'password', 
    'secret', 'token', 'jwt'
  ];
  
  // Recursive function to sanitize objects
  function recursiveSanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = recursiveSanitize(obj[key]);
      } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        // Mask sensitive values but keep key presence
        obj[key] = typeof obj[key] === 'string' 
          ? `${obj[key].substring(0, 5)}...${obj[key].substring(obj[key].length - 5)}`
          : '[REDACTED]';
      }
    });
    
    return obj;
  }
  
  return recursiveSanitize(sanitized);
}

/**
 * Analyzes the sheet ID to check for potential issues
 * @param {string} sheetId - The sheet ID to analyze
 */
export function analyzeSheetId(sheetId) {
  if (!sheetId) {
    debugLog('Sheet ID is missing or empty', { sheetId });
    return;
  }
  
  // Check if sheet ID looks valid
  const validPattern = /^[a-zA-Z0-9_-]{20,50}$/;
  if (!validPattern.test(sheetId)) {
    debugLog('Sheet ID format might be invalid', { 
      sheetId,
      length: sheetId.length,
      containsSpecialChars: /[^a-zA-Z0-9_-]/.test(sheetId)
    });
  }
  
  debugLog('Sheet ID analysis complete', { 
    sheetId: `${sheetId.substring(0, 5)}...${sheetId.substring(sheetId.length - 5)}`,
    length: sheetId.length 
  });
}

/**
 * Analyzes the private key formatting
 * @param {string} privateKey - The private key to analyze
 */
export function analyzePrivateKey(privateKey) {
  if (!privateKey) {
    debugLog('Private key is missing or empty');
    return;
  }
  
  let problems = [];
  
  // Check for common problems
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    problems.push('Missing BEGIN marker');
  }
  
  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    problems.push('Missing END marker');
  }
  
  if (privateKey.includes('\\n') && !privateKey.includes('\n')) {
    problems.push('Contains escaped newlines (\\n) but no actual newlines');
  }
  
  debugLog('Private key analysis', { 
    length: privateKey.length,
    problems: problems.length ? problems : 'None detected',
    sample: privateKey.substring(0, 20) + '...'
  });
}

export default {
  debugLog,
  debugLogError,
  analyzeSheetId,
  analyzePrivateKey
};
