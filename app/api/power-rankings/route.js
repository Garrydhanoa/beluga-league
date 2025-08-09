import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { debugLog, debugLogError, analyzeSheetId, analyzePrivateKey } from './debug-log';

// Cache mechanism
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds for hourly updates
let cachedData = {};

// Hard-coded sheet names for Majors (using these as fallback)
const MAJORS_SHEET_NAMES = {
  1: "Majors W1",
  2: "Majors W2",
  3: "Majors W3",
  4: "Majors W4",
  5: "Majors W5",
  6: "Majors W6",
  7: "Majors W7",
  8: "Majors W8"
};

// Get sheet ID from environment variable or fallback to hardcoded value
const POWER_RANKINGS_SHEET_ID = process.env.POWER_RANKINGS_SHEET_ID || '1wU4Za1xjl_VZwIlaJPeFgP0JRlrOxscJZb0MADxX5CE';

// Specific sheet IDs for different divisions as a last resort fallback
const DIVISION_SHEET_IDS = {
  // These are fallbacks if the main sheet doesn't work
  majors: process.env.MAJORS_SHEET_ID || POWER_RANKINGS_SHEET_ID,
  aa: process.env.AA_SHEET_ID || POWER_RANKINGS_SHEET_ID,
  aaa: process.env.AAA_SHEET_ID || POWER_RANKINGS_SHEET_ID
};
const DIVISIONS = ['aa', 'aaa', 'majors'];
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];

// Using hourly updates instead of a fixed time
// const UPDATE_HOUR_EST = 21; // 9 PM EST - No longer used

// Function to check if the cache needs to be refreshed based on 9 PM EST schedule
// Modify the shouldRefreshCache function to enforce strict hourly updates
function shouldRefreshCache(cacheKey, isInitialLoad = false) {
  // If no cache exists, definitely refresh
  if (!cachedData[cacheKey]) {
    return true;
  }
  
  // Get current time
  const now = new Date();
  
  // Get the timestamp of when the cache was last updated
  const lastUpdateTime = new Date(cachedData[cacheKey].timestamp);
  
  // Calculate cache age in milliseconds
  const cacheAge = now.getTime() - lastUpdateTime.getTime();
  
  // Only refresh the cache if:
  // 1. It's a server restart/deployment (the server process is fresh)
  // 2. The cache is older than CACHE_TTL (1 hour)
  
  // For a deployment, the Node.js process is fresh, so we'll refresh once
  const processStartTime = process.env.SERVER_START_TIME ? parseInt(process.env.SERVER_START_TIME, 10) : null;
  const isServerRestart = processStartTime && (now.getTime() - processStartTime < 120000); // Within 2 minutes of server start
  
  // If this is a server restart/deployment, refresh the cache
  if (isServerRestart) {
    console.log(`Cache refresh needed for ${cacheKey}: Server was just deployed or restarted`);
    return true;
  }
  
  // If the cache is older than the TTL (1 hour), refresh it
  if (cacheAge > CACHE_TTL) {
    const cacheAgeMinutes = Math.floor(cacheAge / 60000);
    const cachedTimeString = new Date(cachedData[cacheKey].timestamp).toLocaleTimeString();
    console.log(`Cache refresh needed for ${cacheKey}: Cache is ${cacheAgeMinutes} minutes old (older than 60 minutes). Last updated at ${cachedTimeString}`);
    return true;
  }
  
  // Cache is still fresh, no need to refresh
  const remainingMinutes = Math.floor((CACHE_TTL - cacheAge) / 60000);
  const cachedTimeString = new Date(cachedData[cacheKey].timestamp).toLocaleTimeString();
  const nextRefreshTime = new Date(cachedData[cacheKey].timestamp + CACHE_TTL).toLocaleTimeString();
  console.log(`Cache for ${cacheKey} is still fresh (last updated at ${cachedTimeString}). Next refresh in ${remainingMinutes} minutes at approximately ${nextRefreshTime}`);
  return false;
}

// Get credentials from environment variables
async function getCredentials() {
  try {
    // Check for environment variables first - check both variable names for compatibility
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    // Use our fixed key if available (for Vercel Majors special handling)
    let privateKey = process.env.GOOGLE_PRIVATE_KEY_FIXED || process.env.GOOGLE_PRIVATE_KEY;
    
    // Debug environment variables (safely, not showing full key)
    debugLog('Environment check:', {
      nodeEnv: process.env.NODE_ENV || 'not set',
      isVercel: !!process.env.VERCEL,
      hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasGoogleServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      usingFixedKey: !!process.env.GOOGLE_PRIVATE_KEY_FIXED,
      powerRankingsSheetId: POWER_RANKINGS_SHEET_ID ? 
        `${POWER_RANKINGS_SHEET_ID.substring(0, 5)}...${POWER_RANKINGS_SHEET_ID.substring(POWER_RANKINGS_SHEET_ID.length - 5)}` : 
        'not set'
    });
    
    // Analyze sheet ID early to help troubleshoot issues
    analyzeSheetId(POWER_RANKINGS_SHEET_ID);
    
    if (clientEmail && privateKey) {
      debugLog(`Using credentials from environment variables`, {
        email: clientEmail.substring(0, 5) + '...' + clientEmail.substring(clientEmail.length - 5)
      });
      
      // Enhanced private key analysis
      analyzePrivateKey(privateKey);
      
      // In Vercel, sometimes the key may need extra processing
      if (process.env.VERCEL && !process.env.GOOGLE_PRIVATE_KEY_FIXED) {
        debugLog('Processing private key for Vercel environment');
        
        // If the key doesn't have the expected format, try to parse it
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          // Try to handle potential JSON-stringified version of the key
          try {
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
              privateKey = JSON.parse(privateKey);
              debugLog('Private key appears to be JSON-stringified, parsed successfully');
            }
          } catch (e) {
            debugLogError('Failed to parse JSON-stringified private key', e);
          }
        }
        
        // Enhanced debugging for escaped newlines
        if (privateKey.includes('\\n')) {
          debugLog('Private key contains escaped newlines, fixing...');
          privateKey = privateKey
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\"/g, '"');
        }
          
        // Apply standard Vercel fixes
        privateKey = privateKey
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\"/g, '"');
          
        debugLog('Private key processing complete');
      } else if (!process.env.VERCEL) {
        privateKey = privateKey.replace(/\\n/g, '\n'); // Standard fix for escaped newlines
      }
      
      // Log key format details for debugging
      const keyStart = privateKey.substring(0, 30).replace(/\n/g, '[LF]');
      debugLog(`Private key validation`, {
        keyStart: keyStart + '...',
        hasProperFormat: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
        keyLength: privateKey.length,
        containsNewlines: privateKey.includes('\n'),
        containsEscapedNewlines: privateKey.includes('\\n')
      });
      
      // Check if the private key contains expected format
      const hasProperFormat = privateKey.includes('-----BEGIN PRIVATE KEY-----');
      
      // If we're on Vercel and the key is still malformed, attempt one more fix
      if (process.env.VERCEL && !hasProperFormat) {
        debugLog('Attempting emergency key format fix for Vercel');
        
        // Clean the key of any existing headers/footers
        const cleanKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
        
        // Reconstruct with proper format
        privateKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
        
        debugLog('Emergency key fix applied', {
          keyStartsNow: privateKey.substring(0, 30).replace(/\n/g, '[LF]') + '...'
        });
        
        // Set the fixed key for future use
        process.env.GOOGLE_PRIVATE_KEY_FIXED = privateKey;
      }
      
      // EXTREME MEASURE FOR VERCEL: 
      // If we're on Vercel and working with Majors division, create a completely new key from scratch
      // based on the environment variable, using a known good format
      if (process.env.VERCEL && !process.env.GOOGLE_PRIVATE_KEY_FIXED) {
        try {
          debugLog('Attempting extreme key formatting fix for Vercel');
          
          // Get the raw key content
          let rawKey = privateKey;
          
          // Remove any existing headers/footers and whitespace
          rawKey = rawKey
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\r/g, '')
            .replace(/\n/g, '')
            .replace(/\s/g, '');
            
          // Create properly formatted key with correct headers and line breaks
          const formattedKey = [
            '-----BEGIN PRIVATE KEY-----',
            ...rawKey.match(/.{1,64}/g), // Split into 64-character chunks
            '-----END PRIVATE KEY-----'
          ].join('\n');
          
          debugLog('Created completely reformatted key', { 
            length: formattedKey.length,
            hasBeginMarker: formattedKey.includes('-----BEGIN PRIVATE KEY-----'),
            hasEndMarker: formattedKey.includes('-----END PRIVATE KEY-----'),
            lineCount: formattedKey.split('\n').length
          });
          
          // Save the fixed key
          process.env.GOOGLE_PRIVATE_KEY_FIXED = formattedKey;
          privateKey = formattedKey;
        } catch (e) {
          debugLogError('Failed during extreme key formatting', e);
        }
      }
      
      return {
        email: clientEmail,
        key: privateKey,
      };
    }

    // In production (Vercel), we should only use environment variables
    if (process.env.VERCEL) {
      debugLogError('No credentials in environment variables on Vercel', new Error('Missing credentials'), {
        action: 'Check Vercel project settings for GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY'
      });
      return null;
    }
    
    // In development, we can try to use credentials.json as fallback
    // but only during local development, not on Vercel
    debugLog('Attempting to load credentials from credentials.json');
    
    try {
      // For local development only, using dynamic import
      if (typeof process !== 'undefined' && process.cwd) {
        // We're in Node.js environment
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const credentialsPath = path.join(process.cwd(), 'credentials.json');
        const data = await fs.readFile(credentialsPath, 'utf8');
        const credentials = JSON.parse(data);
        debugLog('Successfully loaded credentials from credentials.json');
        return { email: credentials.client_email, key: credentials.private_key };
      } else {
        debugLogError('Not in Node.js environment', new Error('Cannot load credentials file'));
        return null;
      }
    } catch (e) {
      debugLogError('Failed to load credentials.json', e);
      return null;
    }
  } catch (e) {
    debugLogError('Error getting credentials', e);
    return null;
  }
}

// Connect to Google Sheets
async function connectToGoogleSheet(sheetId) {
  try {
    const credentials = await getCredentials();
    
    if (!credentials) {
      throw new Error('No credentials available');
    }
    
    const jwt = new JWT({
      email: credentials.email,
      key: credentials.key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.error('Error connecting to Google Sheet:', error);
    throw error;
  }
}

// Function to find a sheet that matches the pattern (e.g., "AA W1", "AAA W2", "Majors W1")
function findSheetByPattern(doc, division, week) {
  let patterns = [];
  
  if (division.toLowerCase() === 'majors') {
    // For Majors, try many different capitalization and format patterns
    // Create a comprehensive list of patterns for Majors
    patterns = [
      // Majors with first letter capitalized
      new RegExp(`^Majors\\s*W${week}$`, 'i'),
      new RegExp(`^Majors\\s*Week\\s*${week}$`, 'i'),
      new RegExp(`^Majors\\s*${week}$`, 'i'),
      // MAJORS all caps
      new RegExp(`^MAJORS\\s*W${week}$`, 'i'),
      new RegExp(`^MAJORS\\s*Week\\s*${week}$`, 'i'),
      new RegExp(`^MAJORS\\s*${week}$`, 'i'),
      // majors all lowercase
      new RegExp(`^majors\\s*W${week}$`, 'i'),
      new RegExp(`^majors\\s*Week\\s*${week}$`, 'i'),
      new RegExp(`^majors\\s*${week}$`, 'i'),
      // Try with variation in spacing
      new RegExp(`^Majors[\\s_-]*W[\\s_-]*${week}$`, 'i'),
      // Try with 'Major' singular form (in case of typo)
      new RegExp(`^Major\\s*W${week}$`, 'i'),
      // Super flexible patterns for Vercel compatibility
      new RegExp(`.*[Mm][Aa][Jj][Oo][Rr][Ss]?.*W.*${week}.*`, 'i'),  // No ^ anchor for more flexibility
      new RegExp(`.*[Mm][Aa][Jj][Oo][Rr][Ss]?.*${week}.*`, 'i'),     // No ^ anchor, no "W"
      new RegExp(`.*[Mm][Aa][Jj][Oo][Rr].*${week}.*`, 'i'),          // Just look for "major" + week number
      // Exact sheet name matches that might exist
      new RegExp(`^Week ${week} - Majors$`, 'i'),
      new RegExp(`^W${week} - Majors$`, 'i'),
      new RegExp(`^Week${week} - Majors$`, 'i'),
      new RegExp(`^Week ${week} Majors$`, 'i'),
      // Try with "Division" in the name
      new RegExp(`.*[Mm][Aa][Jj][Oo][Rr][Ss]?.*[Dd]ivision.*${week}.*`, 'i'),
      // Try with any separation character between "majors" and week number
      new RegExp(`.*[Mm][Aa][Jj][Oo][Rr][Ss]?[\\s_\\-:;.,].*${week}.*`, 'i'),
    ];
    
    console.log(`Using ${patterns.length} different patterns to match Majors sheets`);
  } else {
    // Standard patterns for AA and AAA
    patterns = [
      new RegExp(`^${division}\\s*W${week}$`, 'i'),        // Standard: "AA W1"
      new RegExp(`^${division}\\s*Week\\s*${week}$`, 'i'), // With "Week": "AA Week 1"
      new RegExp(`^${division}\\s*${week}$`, 'i'),         // Without W: "AA 1"
    ];
  }
  
  // Loop through all sheets and check against all patterns
  for (let i = 0; i < doc.sheetCount; i++) {
    const sheet = doc.sheetsByIndex[i];
    const sheetTitle = sheet.title.trim();
    
    // Log sheet title for debugging
    console.log(`Checking sheet title: "${sheetTitle}"`);
    
    // Try each pattern
    for (const pattern of patterns) {
      if (pattern.test(sheetTitle)) {
        console.log(`Found matching sheet: "${sheetTitle}" for division "${division}" week ${week} using pattern: ${pattern}`);
        return sheet;
      }
    }
    
    // Special fallback case for Majors division only - more aggressive matching
    if (division.toLowerCase() === 'majors') {
      // Case 1: If the title contains "major" (any case) and the week number
      if (sheetTitle.toLowerCase().includes('major') && 
          sheetTitle.includes(week.toString())) {
        console.log(`Found Majors sheet using fallback matching: "${sheetTitle}" contains "major" and "${week}"`);
        return sheet;
      }
      
      // Case 2: If the sheet name looks like it might be week-related for Majors
      if ((sheetTitle.toLowerCase().includes('week') || 
          sheetTitle.toLowerCase().includes(' w') || 
          sheetTitle.match(/\bw\s*\d+\b/i)) && 
          sheetTitle.includes(week.toString()) &&
          !sheetTitle.toLowerCase().includes('aa')) {  
        if (
          // Not obviously for other divisions
          !sheetTitle.toLowerCase().includes('aa ') && 
          !sheetTitle.toLowerCase().includes('aaa ') &&
          !sheetTitle.toLowerCase().match(/\baa\b/i) &&
          !sheetTitle.toLowerCase().match(/\baaa\b/i)
        ) {
          console.log(`Found potential Majors sheet using week matching: "${sheetTitle}" contains week indicator and "${week}" without AA/AAA markers`);
          return sheet;
        }
      }
      
      // Case 3: If the title contains "m" and the week number (extreme fallback)
      // This is a last resort to try to find anything remotely resembling a Majors sheet
      if (sheetTitle.toLowerCase().includes('m') && 
          sheetTitle.includes(week.toString()) &&
          !sheetTitle.toLowerCase().includes('aa')) {  // Exclude AA to avoid picking AAA sheets
        console.log(`Found Majors sheet using extreme fallback: "${sheetTitle}" contains "m" and "${week}" and not "aa"`);
        return sheet;
      }
    }
  }
  
  // Log all sheet titles if no match found
  console.log("No matching sheet found. Available sheets:");
  
  // Create a list of all sheet titles for debugging
  let allSheets = [];
  let potentialMajorsSheets = [];
  
  for (let i = 0; i < Math.min(doc.sheetCount, 50); i++) {
    const sheetTitle = doc.sheetsByIndex[i].title;
    allSheets.push(sheetTitle);
    
    // Check if this sheet might be what we're looking for based on loose matching
    if (division.toLowerCase() === 'majors') {
      const sheetLower = sheetTitle.toLowerCase();
      // Check for anything that might be a majors sheet
      if (sheetLower.includes('major') || 
          (sheetLower.includes('m') && sheetLower.includes(week.toString()) && !sheetLower.includes('aa'))) {
        console.log(`POTENTIAL MATCH FOUND: "${sheetTitle}" might be a Majors sheet`);
        potentialMajorsSheets.push(doc.sheetsByIndex[i]);
      }
    }
  }
  
  console.log(`All sheets (${allSheets.length}): ${allSheets.join(', ')}`);
  console.log(`Tried patterns for division "${division}": ${patterns.map(p => p.toString()).join(', ')}`);
  
  // For Majors division only: If we have potential matches, try them all as a last resort
  if (division.toLowerCase() === 'majors' && potentialMajorsSheets.length > 0) {
    console.log(`Trying ${potentialMajorsSheets.length} potential Majors sheets as last resort`);
    
    // Sort sheets by likelihood (sheets with "major" in the title first)
    potentialMajorsSheets.sort((a, b) => {
      const aHasMajor = a.title.toLowerCase().includes('major');
      const bHasMajor = b.title.toLowerCase().includes('major');
      if (aHasMajor && !bHasMajor) return -1;
      if (!aHasMajor && bHasMajor) return 1;
      return 0;
    });
    
    // Return the first potential sheet as a desperate measure
    console.log(`Using "${potentialMajorsSheets[0].title}" as fallback for Majors Week ${week}`);
    return potentialMajorsSheets[0];
  }
  
  return null;
}

  // Extract power rankings data from a specific sheet
async function extractPowerRankingsData(sheet) {
  try {
    await sheet.loadCells('G21:J35'); // Load teams (G21-H30) and players (I21-J25) data
    
    // Get sheet dimensions to check if historical data is available
    const sheetColumns = sheet._columnCount;
    const hasHistoricalData = sheetColumns > 10; // Check if we have columns beyond J
    
    // Only try to load historical data if the sheet has enough columns
    if (hasHistoricalData) {
      try {
        // Only load columns that exist in the sheet
        const lastColumnLetter = String.fromCharCode(65 + Math.min(18, sheetColumns - 1)); // Convert to letter (A=65 in ASCII)
        await sheet.loadCells(`K21:${lastColumnLetter}30`); // Historical team rankings across weeks
      } catch (e) {
        console.log('No historical rankings available', e);
      }
    }
    
    const teams = [];
    const players = [];
    const history = {};
    
    // Extract teams (top 10)
    for (let row = 21; row <= 30; row++) {
      const teamCell = sheet.getCell(row - 1, 6); // Column G (0-indexed)
      const pointsCell = sheet.getCell(row - 1, 7); // Column H (0-indexed)
      
      if (teamCell.value) {
        const teamName = teamCell.value.toString().trim();
        const team = {
          team: teamName,
          points: pointsCell.value || 0,
        };
        
        // Only try to extract historical rankings if we have enough columns
        if (hasHistoricalData) {
          const teamHistory = [];
          try {
            // Only iterate through columns that actually exist in the sheet
            const maxHistoricalCol = Math.min(18, sheetColumns - 1);
            for (let weekCol = 10; weekCol <= maxHistoricalCol; weekCol++) { // Columns K+ (10+ in 0-indexed)
              const rankCell = sheet.getCell(row - 1, weekCol);
              if (rankCell.value !== null && rankCell.value !== undefined) {
                teamHistory.push(parseInt(rankCell.value, 10) || null);
              } else {
                teamHistory.push(null); // No data for this week
              }
            }
            
            if (teamHistory.some(rank => rank !== null)) {
              history[teamName] = teamHistory;
            }
          } catch (e) {
            console.log(`Could not extract history for ${teamName}`, e);
          }
        }        teams.push(team);
      }
    }
    
    // Extract players (top 5)
    for (let row = 21; row <= 25; row++) {
      const playerCell = sheet.getCell(row - 1, 8); // Column I (0-indexed)
      const pointsCell = sheet.getCell(row - 1, 9); // Column J (0-indexed)
      
      if (playerCell.value) {
        players.push({
          player: playerCell.value.toString().trim(),
          points: pointsCell.value || 0,
        });
      }
    }
    
    return {
      teams,
      players,
      history: Object.keys(history).length > 0 ? history : null
    };
  } catch (error) {
    console.error('Error extracting power rankings data:', error);
    throw error;
  }
}

// Main function to fetch power rankings
async function fetchPowerRankings(division, week, isInitialLoad = false, bypassCache = false) {
  try {
    // Format division for sheet lookup - be more flexible with sheet naming
    let formattedDivision;
    if (division.toLowerCase() === 'majors') {
      // For Majors, we'll use multiple patterns with different capitalizations
      // in the findSheetByPattern function, so just preserve the lowercase version
      formattedDivision = 'majors';
      debugLog('Handling Majors division with enhanced case sensitivity matching');
      
      // Enhanced debugging for Vercel
      if (process.env.VERCEL) {
        console.log('Running on Vercel: Adding extra Majors debugging information');
        console.log(`Sheet ID being used: ${POWER_RANKINGS_SHEET_ID}`);
        if (DIVISION_SHEET_IDS?.majors) {
          console.log(`Majors-specific sheet ID: ${DIVISION_SHEET_IDS.majors}`);
        }
        
        // Special Vercel-only direct sheet access for Majors
        try {
          console.log("Trying Vercel-specific direct sheet approach for Majors");
          // We'll use a direct mapping for Majors since pattern matching isn't working reliably
          const vercelSheetMap = {
            1: "Majors W1", // This is the exact sheet name you said it is
            2: "Majors W2",
            3: "Majors W3",
            4: "Majors W4",
            5: "Majors W5",
            6: "Majors W6",
            7: "Majors W7",
            8: "Majors W8"
          };
          
          // Check cache first
          const cacheKey = `${division}-week${week}`;
          if (cachedData[cacheKey] && !shouldRefreshCache(cacheKey, isInitialLoad)) {
            // Return cached data if it exists and doesn't need refreshing
            console.log(`Using cached power rankings for ${division} Week ${week}, cached at ${new Date(cachedData[cacheKey].timestamp).toLocaleString()}`);
            return {
              data: cachedData[cacheKey].data,
              cachedAt: cachedData[cacheKey].timestamp,
              fromCache: true,
            };
          }
          
          // Connect to Google Sheets with credentials
          const credentials = await getCredentials();
          if (!credentials) {
            throw new Error('No credentials available for Vercel direct Majors access');
          }
          
          const jwt = new JWT({
            email: credentials.email,
            key: credentials.key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const doc = new GoogleSpreadsheet(POWER_RANKINGS_SHEET_ID, jwt);
          await doc.loadInfo();
          
          console.log(`Loaded ${doc.sheetCount} sheets for direct Majors access`);
          
          // For debugging, log all sheet titles
          const allSheetTitles = [];
          for (let i = 0; i < Math.min(doc.sheetCount, 30); i++) {
            allSheetTitles.push(doc.sheetsByIndex[i].title);
          }
          console.log("All available sheets:", allSheetTitles.join(', '));
          
          // Try to get the sheet directly by title
          const exactSheetTitle = vercelSheetMap[week];
          let sheet = null;
          
          if (exactSheetTitle) {
            console.log(`Trying to access exact sheet title: "${exactSheetTitle}"`);
            sheet = doc.sheetsByTitle[exactSheetTitle];
            
            if (sheet) {
              console.log(`SUCCESS: Found exact match for Majors sheet: "${exactSheetTitle}"`);
              return await processFoundSheet(sheet, division, week, cacheKey);
            } else {
              console.log(`Sheet "${exactSheetTitle}" not found by exact title match`);
            }
          }
          
          // If exact title doesn't work, try case-insensitive matching
          if (!sheet) {
            console.log("Trying case-insensitive title matching");
            const lowerTitle = exactSheetTitle.toLowerCase();
            let bestMatch = null;
            
            for (let i = 0; i < doc.sheetCount; i++) {
              const currentTitle = doc.sheetsByIndex[i].title;
              if (currentTitle.toLowerCase() === lowerTitle) {
                bestMatch = doc.sheetsByIndex[i];
                console.log(`Found case-insensitive match: "${currentTitle}"`);
                break;
              }
            }
            
            if (bestMatch) {
              console.log(`Using case-insensitive matched sheet: "${bestMatch.title}"`);
              return await processFoundSheet(bestMatch, division, week, cacheKey);
            }
          }
          
          // If we still haven't found a sheet, try direct index approach
          // Sometimes the first few sheets might be the ones we need
          if (!sheet && week <= 8) {
            // Try accessing by index - sheets might be in week order
            console.log("Trying direct index approach for Majors sheets");
            
            // Adjust for zero-based index, and we're guessing the sheet position
            // Week 1 might be at index 0, Week 2 at index 1, etc.
            // This is a fallback approach if nothing else works
            const possibleIndexes = [
              week - 1,       // If sheets start at 0 (Week 1 = sheet 0)
              week,           // If sheets start at 1 (Week 1 = sheet 1)
              week + 2,       // Some other offset
              10 + week,      // If Majors sheets start later
            ];
            
            for (const idx of possibleIndexes) {
              if (idx >= 0 && idx < doc.sheetCount) {
                const potentialSheet = doc.sheetsByIndex[idx];
                console.log(`Trying direct index ${idx}: Sheet titled "${potentialSheet.title}"`);
                
                // Check if this sheet looks like it might be right
                const title = potentialSheet.title.toLowerCase();
                if (!title.includes('aa') && (title.includes('major') || title.includes('w') || title.includes('week'))) {
                  console.log(`Using sheet at index ${idx} as fallback: "${potentialSheet.title}"`);
                  return await processFoundSheet(potentialSheet, division, week, cacheKey);
                }
              }
            }
          }
        } catch (err) {
          console.error("Vercel-specific direct Majors approach failed:", err);
          // Continue with the regular approach
        }
      }
    } else {
      // For AA and AAA, use uppercase
      formattedDivision = division.toUpperCase();
    }
    
    console.log(`Fetching power rankings for ${formattedDivision} Week ${week}`);
    
    // Check cache first - but ONLY refresh under specific conditions:
    // 1. After 9 PM EST and we haven't updated today
    // 2. Server just restarted (deployment)
    const cacheKey = `${division}-week${week}`;
    if (cachedData[cacheKey] && !shouldRefreshCache(cacheKey, isInitialLoad)) {
      // Return cached data if it exists and doesn't need refreshing
      console.log(`Using cached power rankings for ${division} Week ${week}, cached at ${new Date(cachedData[cacheKey].timestamp).toLocaleString()}`);
      return {
        data: cachedData[cacheKey].data,
        cachedAt: cachedData[cacheKey].timestamp,
        fromCache: true,
      };
    }
    
    // Try the main sheet first
    let mainSheetError = null;
    let sheet = null;
    let doc = null;
    
    try {
      doc = await connectToGoogleSheet(POWER_RANKINGS_SHEET_ID);
      console.log(`Connected to main power rankings sheet: ${POWER_RANKINGS_SHEET_ID.substring(0, 6)}...`);
      
      // Try to find the sheet with different division name formats
      sheet = findSheetByPattern(doc, formattedDivision, week);
      
      if (sheet) {
        console.log(`Found sheet in main document: "${sheet.title}"`);
        return await processFoundSheet(sheet, division, week, cacheKey);
      }
      
      console.log(`No sheet found in main document for ${formattedDivision} Week ${week}`);
    } catch (error) {
      mainSheetError = error;
      console.error(`Error with main sheet: ${error.message}`);
    }
    
    // If we get here, we couldn't find a sheet in the main document
    // Try division-specific sheet as fallback (if it exists and is different)
    if (DIVISION_SHEET_IDS[division.toLowerCase()] && 
        DIVISION_SHEET_IDS[division.toLowerCase()] !== POWER_RANKINGS_SHEET_ID) {
      try {
        console.log(`Trying division-specific sheet for ${division}: ${DIVISION_SHEET_IDS[division.toLowerCase()].substring(0, 6)}...`);
        const divDoc = await connectToGoogleSheet(DIVISION_SHEET_IDS[division.toLowerCase()]);
        
        // Try to find the sheet with different division name formats
        const divSheet = findSheetByPattern(divDoc, formattedDivision, week);
        
        if (divSheet) {
          console.log(`Found sheet in division-specific document: "${divSheet.title}"`);
          return await processFoundSheet(divSheet, division, week, cacheKey);
        }
      } catch (divError) {
        console.error(`Error with division-specific sheet: ${divError.message}`);
      }
    }
    
    // If we reach here, we've exhausted all options or had errors
    // If we had an error with the main sheet and couldn't get a document, throw it
    if (mainSheetError && !doc) {
      throw mainSheetError;
    }
    
    // If we have a document but no sheet was found
    if (doc) {
      // Check if any sheets contain the division name to help diagnose issues
      let foundSheets = [];
      let weekSheets = [];
      
      // For each sheet, check if it contains the division name or the week number
      for (let i = 0; i < doc.sheetCount; i++) {
        const sheetTitle = doc.sheetsByIndex[i].title.toLowerCase();
        
        if (sheetTitle.includes(division.toLowerCase())) {
          foundSheets.push(doc.sheetsByIndex[i].title);
        }
        
        // Also track all sheets with the week number for potential fallback
        if (sheetTitle.includes(week.toString()) || 
            sheetTitle.includes(`week ${week}`) || 
            sheetTitle.includes(`w${week}`)) {
          weekSheets.push({
            title: doc.sheetsByIndex[i].title,
            sheet: doc.sheetsByIndex[i]
          });
        }
      }
      
      if (foundSheets.length > 0) {
        console.log(`Found some sheets that might be related: ${foundSheets.join(', ')}`);
        
        // If we have division-specific sheets but no exact match, try the first one as fallback
        if (division.toLowerCase() === 'majors' && foundSheets.length > 0) {
          // Try to find a sheet with both division and week number
          const bestMatch = foundSheets.find(title => 
            title.toLowerCase().includes(week.toString()) || 
            title.toLowerCase().includes(`week ${week}`) ||
            title.toLowerCase().includes(`w${week}`));
            
          if (bestMatch) {
            console.log(`Using best match "${bestMatch}" as fallback for ${division} Week ${week}`);
            const sheet = doc.sheetsByTitle[bestMatch];
            if (sheet) {
              return await processFoundSheet(sheet, division, week, cacheKey);
            }
          } else if (weekSheets.length > 0) {
            // As an extreme fallback, use any sheet with the right week number for Majors
            // Sort by likelihood of being a Majors sheet
            weekSheets.sort((a, b) => {
              const aLower = a.title.toLowerCase();
              const bLower = b.title.toLowerCase();
              
              // Prefer sheets that don't explicitly mention other divisions
              const aHasAA = aLower.includes('aa');
              const bHasAA = bLower.includes('aa'); 
              
              if (!aHasAA && bHasAA) return -1;
              if (aHasAA && !bHasAA) return 1;
              return 0;
            });
            
            // Use the first sheet that doesn't explicitly mention "aa" or "aaa"
            const nonAASheet = weekSheets.find(item => 
              !item.title.toLowerCase().includes('aa ') && 
              !item.title.toLowerCase().match(/\baaa\b/i) &&
              !item.title.toLowerCase().match(/\baa\b/i));
              
            if (nonAASheet) {
              console.log(`Using ${nonAASheet.title} as extreme fallback for Majors Week ${week}`);
              return await processFoundSheet(nonAASheet.sheet, division, week, cacheKey);
            }
          }
        }
      }
    }
    
    return {
      data: null,
      error: `Power rankings for ${division.toUpperCase()} Week ${week} are not available yet. They will be released during Week ${week}.`,
    };
  } catch (error) {
    console.error('Error in fetchPowerRankings:', error);
    
    // Check if we have cached data to fall back on
    const cacheKey = `${division}-week${week}`;
    if (cachedData[cacheKey]) {
      return {
        data: cachedData[cacheKey].data,
        cachedAt: cachedData[cacheKey].timestamp,
        fromCache: true,
        fetchError: error.message || 'Failed to fetch fresh power rankings data',
      };
    }
    
    return {
      data: null,
      error: error.message || 'Failed to fetch power rankings',
    };
  }
}

/**
 * Helper function to process a found sheet
 * @param {Object} sheet - The Google Sheet to process
 * @param {string} division - The division name
 * @param {number} week - The week number
 * @param {string} cacheKey - The cache key for storing data
 * @returns {Object} The processed data with metadata
 */
async function processFoundSheet(sheet, division, week, cacheKey) {
  try {
    let data = await extractPowerRankingsData(sheet);
  
    // Normalize team names
    if (data.teams && data.teams.length > 0) {
      data.teams = data.teams.map(entry => ({
        ...entry,
        team: normalizeTeamName(entry.team),
      }));
    }
    
    // Cache the data
    const timestamp = Date.now();
    cachedData[cacheKey] = {
      data,
      timestamp,
    };
    
    // Calculate the next update time (1 hour from now)
    const now = new Date();
    const nextUpdateTime = new Date(now.getTime() + CACHE_TTL);
    
    // Format the update time for human readability
    const formattedUpdateTime = now.toLocaleTimeString();
    console.log(`Data for ${cacheKey} updated at ${formattedUpdateTime}. Next refresh at ${nextUpdateTime.toLocaleTimeString()}`);
    
    return {
      data,
      cachedAt: timestamp,
      fromCache: false,
      nextUpdateAt: nextUpdateTime.getTime(),
      lastUpdated: formattedUpdateTime,
      lastScheduledUpdate: now.getTime()
    };
  } catch (error) {
    console.error('Error processing sheet data:', error);
    throw error;
  }
}

// Helper function to normalize team names
function normalizeTeamName(inputTeam) {
  // This list must exactly match the filenames in public/logos directory
  const CANONICAL_TEAM_NAMES = [
    "Acid Esports", "Alchemy Esports", "Archangels", "Aviators", 
    "Fallen Angels", "Immortals", "InTraCate", "Kingdom", 
    "Lotus", "Malfeasance", "MNML", "Panthers",
    "Sublunary", "Surge", "Valkyries", "Wizards"
  ];
  
  // First, try an exact case-insensitive match (but return the correct case from our list)
  const exactMatch = CANONICAL_TEAM_NAMES.find(
    name => name.toLowerCase() === inputTeam.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Next, try partial matches
  const partialMatch = CANONICAL_TEAM_NAMES.find(
    name => inputTeam.toLowerCase().includes(name.toLowerCase()) || 
           name.toLowerCase().includes(inputTeam.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Special cases and abbreviations with exact matches to filenames
  if (inputTeam.toLowerCase().includes("acid")) return "Acid Esports";
  if (inputTeam.toLowerCase().includes("alchemy")) return "Alchemy Esports";
  if (inputTeam.toLowerCase().includes("arch")) return "Archangels";
  if (inputTeam.toLowerCase().includes("avia")) return "Aviators";
  if (inputTeam.toLowerCase().includes("fallen")) return "Fallen Angels";
  if (inputTeam.toLowerCase().includes("immort")) return "Immortals";
  if (inputTeam.toLowerCase().includes("intra")) return "InTraCate";
  if (inputTeam.toLowerCase().includes("king")) return "Kingdom";
  if (inputTeam.toLowerCase().includes("lot")) return "Lotus";
  if (inputTeam.toLowerCase().includes("malf")) return "Malfeasance";
  if (inputTeam.toLowerCase().includes("mnml") || inputTeam.toLowerCase() === "minimal") return "MNML";
  if (inputTeam.toLowerCase().includes("panth")) return "Panthers";
  if (inputTeam.toLowerCase().includes("sub")) return "Sublunary";
  if (inputTeam.toLowerCase().includes("surg")) return "Surge";
  if (inputTeam.toLowerCase().includes("valk")) return "Valkyries";
  if (inputTeam.toLowerCase().includes("wiz")) return "Wizards";
  
  // Log issues with team name matching for debugging
  console.warn(`Team name "${inputTeam}" could not be matched to a canonical team name`);
  
  return inputTeam; // Return original if no match found
}

export async function GET(request) {
  try {
    // Store server start time if it doesn't exist yet (for detecting deployments)
    if (!process.env.SERVER_START_TIME) {
      process.env.SERVER_START_TIME = Date.now().toString();
      debugLog(`Setting initial server start time: ${process.env.SERVER_START_TIME}`);
    }
    
    // Add a unique request ID for tracking requests
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    debugLog(`Request started [${requestId}]`, { timestamp: new Date().toISOString() });

    const url = new URL(request.url);
    const division = url.searchParams.get('division')?.toLowerCase() || 'majors';
    const week = parseInt(url.searchParams.get('week') || '1', 10);
    
    // Keep track of initialLoad for better caching behavior but IGNORE realtime parameter
    // This ensures users cannot force refreshes from client side
    const isInitialLoad = url.searchParams.get('initialLoad') === 'true';
    
    debugLog(`Power Rankings API - Request received:`, {
      division,
      week,
      isInitialLoad,
      environment: process.env.NODE_ENV || 'development',
      isVercel: !!process.env.VERCEL
    });
    
    // Special handling for Vercel + Majors division issues
    if (process.env.VERCEL && division === 'majors') {
      console.log('SPECIAL HANDLING: Vercel + Majors division detected');
      console.log('Checking if all environment variables are available and properly formatted');
      
      // Inspect environment variables in detail (safely)
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
      const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
      const sheetId = POWER_RANKINGS_SHEET_ID || '';
      
      console.log(`Client Email: ${clientEmail.substring(0, 5)}...${clientEmail.slice(-5)}`);
      console.log(`Has Private Key: ${hasPrivateKey ? 'Yes' : 'No'}`);
      console.log(`Sheet ID: ${sheetId.substring(0, 5)}...${sheetId.slice(-5)}`);
      
      // If using a special majors-specific sheet ID, log that too
      if (DIVISION_SHEET_IDS?.majors) {
        console.log(`Majors-specific Sheet ID: ${DIVISION_SHEET_IDS.majors.substring(0, 5)}...${DIVISION_SHEET_IDS.majors.slice(-5)}`);
      }
      
      // On Vercel, ensure private key is correctly formatted
      if (hasPrivateKey && process.env.GOOGLE_PRIVATE_KEY) {
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        
        // Check for JSON stringified format
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          try {
            privateKey = JSON.parse(privateKey);
            console.log('Private key was JSON stringified, parsed successfully');
          } catch (e) {
            console.log('Failed to parse JSON stringified key:', e.message);
          }
        }
        
        // Check for newlines
        if (!privateKey.includes('\n')) {
          console.log('Private key missing newlines, attempting to fix...');
          privateKey = privateKey
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\"/g, '"');
            
          // Temporarily override the env var for this request
          process.env.GOOGLE_PRIVATE_KEY_FIXED = privateKey;
        }
      }
    }
    
    // Check for credentials early to provide better error message
    const credentials = await getCredentials();
    if (!credentials) {
      console.error('Missing Google API credentials - returning error response');
      return NextResponse.json({
        error: 'Authentication error: Missing Google API credentials',
        message: 'The application is unable to authenticate with Google Sheets API. Please ensure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are properly set in your Vercel project settings.',
        division: division,
        week: week,
      }, { status: 500 });
    }
    
    // Validate division
    if (!DIVISIONS.includes(division)) {
      console.log(`Power Rankings API - Invalid division: ${division}`);
      return NextResponse.json(
        { error: `Invalid division: ${division}. Valid options are: aa, aaa, majors` },
        { status: 400 }
      );
    }
    
    // Validate week
    if (!WEEKS.includes(week)) {
      console.log(`Power Rankings API - Invalid week: ${week}`);
      return NextResponse.json(
        { error: `Invalid week: ${week}. Valid options are: 1-8` },
        { status: 400 }
      );
    }
    
    debugLog(`Fetching power rankings`, {
      division,
      week,
      isInitialLoad,
      sheetId: POWER_RANKINGS_SHEET_ID?.substring(0, 5) + '...' + POWER_RANKINGS_SHEET_ID?.substring(POWER_RANKINGS_SHEET_ID.length - 5)
    });
    
    let result;
    
    // IMPORTANT: Always use shouldRefreshCache to determine if we need fresh data
    // This makes the backend fully responsible for cache management on the hourly schedule
    const shouldBypassCache = false; // Never bypass cache based on client request
    
    // Special case for Majors division on Vercel - try with pre-emptive hardcoded fallback if needed
    if (process.env.VERCEL && division === 'majors' && MAJORS_SHEET_NAMES[week]) {
      try {
        debugLog(`Attempting special direct access for Majors Week ${week} on Vercel`, {
          exactSheetName: MAJORS_SHEET_NAMES[week],
          bypassCache: shouldBypassCache
        });
        
        // Try normal flow first
        result = await fetchPowerRankings(division, week, isInitialLoad, shouldBypassCache);
        
        // If we got an error, switch to hardcoded fallback immediately
        if (result.error) {
          debugLog(`Regular flow failed for Majors, preparing hardcoded fallback`, {
            error: result.error
          });
        }
      } catch (e) {
        debugLogError(`Error in special Majors handling`, e);
        // Continue to regular fetch or hardcoded fallback
      }
    } else {
      // Normal flow for non-Majors or local development
      result = await fetchPowerRankings(division, week, isInitialLoad, shouldBypassCache);
    }
    
    if (result.error) {
      // This is not a server error, just data isn't available yet
      return NextResponse.json(result, { status: 200 });
    }
    
    // SPECIAL HANDLING FOR MAJORS ON VERCEL:
    // If we've tried everything else and still have errors with Majors, use hardcoded data
    if (process.env.VERCEL && division === 'majors' && result.error && result.error.includes('Authentication error')) {
      console.log("EMERGENCY FALLBACK: Using hardcoded data for Majors division on Vercel");
      
      // Hardcoded data for Majors Week 1
      // This ensures that users will see something rather than an error
      if (week === 1) {
        result = {
          data: {
            teams: [
              { team: "Immortals", points: 100 },
              { team: "Kingdom", points: 95 },
              { team: "Valkyries", points: 90 },
              { team: "Panthers", points: 85 },
              { team: "Wizards", points: 80 },
              { team: "Surge", points: 75 },
              { team: "Fallen Angels", points: 70 },
              { team: "Sublunary", points: 65 },
              { team: "Archangels", points: 60 },
              { team: "Acid Esports", points: 55 }
            ],
            players: [
              { player: "Player1", points: 100 },
              { player: "Player2", points: 95 },
              { player: "Player3", points: 90 },
              { player: "Player4", points: 85 },
              { player: "Player5", points: 80 }
            ],
            history: null
          },
          cachedAt: Date.now(),
          fromCache: false,
          hardcodedFallback: true, // Flag to indicate this is hardcoded
          hardcodedReason: "API authentication issues - please contact site administrator"
        };
      }
    }
    
    // Add information about hourly refresh time
    const now = new Date();
    
    // Calculate next update time (1 hour from last update)
    const nextUpdateTime = result.cachedAt ? 
      new Date(result.cachedAt + CACHE_TTL) : 
      new Date(now.getTime() + CACHE_TTL);
    
    // Calculate time until next update in minutes
    const msUntilNextUpdate = nextUpdateTime.getTime() - now.getTime();
    const minutesUntilNextUpdate = Math.max(0, Math.floor(msUntilNextUpdate / 60000));
    
    // Enhanced refresh info for client display (similar to standings)
    result.refreshInfo = {
      refreshInterval: "Hourly", 
      nextScheduledUpdate: nextUpdateTime.toISOString(),
      lastUpdated: result.cachedAt ? new Date(result.cachedAt).toISOString() : new Date().toISOString(),
      minutesUntilNextUpdate: minutesUntilNextUpdate,
      dataAge: result.cachedAt ? `${Math.floor((now.getTime() - result.cachedAt) / 60000)} minutes` : "Just updated",
      formattedLastUpdated: result.cachedAt ? 
        new Date(result.cachedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York' // EST/EDT timezone for consistency
        }) : 'Just now',
      nextUpdateFormatted: nextUpdateTime.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      })
    };
    
    // Add cache control headers to prevent browser caching
    // This ensures the browser always checks with the server,
    // but the server will only refresh data on schedule
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Error in power-rankings API route:', error);
    
    // Check if this is a credentials error
    if (error.message?.includes('credentials') || error.message?.includes('authentication')) {
      // Provide a detailed error response to help debugging on Vercel
      const vercelDebuggingInfo = process.env.VERCEL ? {
        vercelRegion: process.env.VERCEL_REGION || 'unknown',
        nodeVersion: process.version,
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        // Add a timestamp for tracking when this error occurred
        errorTimestamp: new Date().toISOString()
      } : {};
      
      return NextResponse.json({
        error: 'Authentication error: Google Sheets API',
        message: 'The application is unable to authenticate with Google Sheets API. Please ensure your environment variables are properly set.',
        details: error.message,
        troubleshooting: 'Verify that GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are correctly set in your Vercel project settings. Make sure the PRIVATE_KEY includes the proper newline characters.',
        division: division, // Include the division that caused the error
        environmentInfo: {
          hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasGoogleServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          isPowerRankingsSheetIdSet: !!POWER_RANKINGS_SHEET_ID,
          sheetIdPrefix: POWER_RANKINGS_SHEET_ID ? POWER_RANKINGS_SHEET_ID.substring(0, 6) + '...' : 'not set',
          ...vercelDebuggingInfo
        }
      }, { status: 500 });
    }
    
    // General error case
    return NextResponse.json(
      { 
        error: 'Failed to fetch power rankings', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
