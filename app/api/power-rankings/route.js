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

// Add these hardcoded fallback data for when all else fails
// This is only used if there's no cached data and the API fetch fails
const FALLBACK_DATA = {
  majors: {},
  aa: {},
  aaa: {}
};

// Add this near the top of your file with the other constants
// This will be used for tracking last server restart
let serverStartTime = Date.now();

// Function to check if the cache needs to be refreshed based on 9 PM EST schedule
// Modify the shouldRefreshCache function to enforce strict hourly updates
function shouldRefreshCache(cacheKey, isInitialLoad = false) {
  // If no cache exists, definitely refresh
  if (!cachedData[cacheKey]) {
    console.log(`No cache exists for ${cacheKey}, fetching fresh data`);
    return true;
  }
  
  // Add this check to make sure we're using the right cache key
  // Extract division and week from cache key
  const match = cacheKey.match(/^(.+)-week(\d+)$/);
  if (match) {
    const [_, divisionFromKey, weekFromKey] = match;
    console.log(`Cache key ${cacheKey} is for ${divisionFromKey} Week ${weekFromKey}`);
  }
  
  // Get current time
  const now = new Date();
  
  // Get the timestamp of when the cache was last updated
  const lastUpdateTime = new Date(cachedData[cacheKey].timestamp);
  
  // Calculate cache age in milliseconds
  const cacheAge = now.getTime() - lastUpdateTime.getTime();
  const cacheAgeMinutes = Math.floor(cacheAge / 60000);
  
  // Check if server was just deployed/restarted
  const isServerRestart = (now.getTime() - serverStartTime < 300000); // Within 5 minutes of server start
  
  if (isServerRestart) {
    console.log(`Cache refresh needed for ${cacheKey}: Server was recently deployed/restarted`);
    return true;
  }
  
  // If the cache is older than the TTL (1 hour), refresh it
  if (cacheAge > CACHE_TTL) {
    console.log(`Cache refresh needed for ${cacheKey}: Cache is ${cacheAgeMinutes} minutes old (older than 60 minutes)`);
    return true;
  }
  
  console.log(`Using existing cache for ${cacheKey}: Cache is ${cacheAgeMinutes} minutes old (less than 60 minutes)`);
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

// Add this debug function at the top of the file
function debugCacheKeys() {
  console.log("==== CURRENT CACHE STATE ====");
  Object.keys(cachedData).forEach(key => {
    const entry = cachedData[key];
    console.log(`${key}: division=${entry.division || 'unknown'}, week=${entry.week || 'unknown'}, timestamp=${new Date(entry.timestamp).toLocaleString()}`);
  });
  console.log("============================");
}

// Replace the findSheetByPattern function with this version
function findSheetByPattern(doc, division, week) {
  // Track what we're looking for
  console.log(`SHEET SEARCH: Finding sheet for ${division} Week ${week} in document with ${doc.sheetCount} sheets`);
  
  let patterns = [];
  const allSheetTitles = doc.sheetsByIndex.map(s => s.title);
  console.log(`Available sheets: ${allSheetTitles.join(', ')}`);
  
  // IMPORTANT CHANGE: Use the same pattern approach for all divisions
  // This is the key fix - use the same reliable pattern matching for Majors that works for AA/AAA
  
  // Create a consistent division format for patterns
  const divName = division.toLowerCase() === 'majors' ? 'Majors' : division.toUpperCase();
  
  // Standard patterns that work for all divisions
  patterns = [
    new RegExp(`^${divName}\\s*W${week}$`, 'i'),        // Standard: "Majors W1" or "AA W1"
    new RegExp(`^${divName}\\s*Week\\s*${week}$`, 'i'), // With "Week": "Majors Week 1" 
    new RegExp(`^${divName}\\s*${week}$`, 'i'),         // Without W: "Majors 1" or "AA 1"
  ];
  
  // Try exact match first (most reliable method)
  const exactWeekSheet = `${divName} W${week}`;
  if (doc.sheetsByTitle[exactWeekSheet]) {
    console.log(`✅ EXACT MATCH: Found sheet "${exactWeekSheet}" for ${division} Week ${week}`);
    const sheet = doc.sheetsByTitle[exactWeekSheet];
    sheet._matchedDivision = division;
    sheet._matchedWeek = week;
    return sheet;
  }
  
  // Loop through all sheets and check against all patterns
  for (let i = 0; i < doc.sheetCount; i++) {
    const sheet = doc.sheetsByIndex[i];
    const sheetTitle = sheet.title.trim();
    
    // Try each pattern
    for (const pattern of patterns) {
      if (pattern.test(sheetTitle)) {
        console.log(`✅ PATTERN MATCH: Found sheet "${sheetTitle}" for ${division} Week ${week} using pattern: ${pattern}`);
        sheet._matchedDivision = division;
        sheet._matchedWeek = week;
        return sheet;
      }
    }
  }
  
  console.log(`❌ No matching sheet found for ${division} Week ${week}`);
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
    // Format division for sheet lookup
    let formattedDivision;
    if (division.toLowerCase() === 'majors') {
      formattedDivision = 'majors';
    } else {
      // For AA and AAA, use uppercase
      formattedDivision = division.toUpperCase();
    }
    
    console.log(`Fetching power rankings for ${formattedDivision} Week ${week}`);
    
    // CRITICAL FIX: Always use distinct cache keys for each division+week combination
    const cacheKey = `${division.toLowerCase()}-week${week}`;
    
    // Check if we have valid cached data and should use it
    if (cachedData[cacheKey] && !shouldRefreshCache(cacheKey, isInitialLoad)) {
      // Return cached data if it exists and doesn't need refreshing
      console.log(`Using cached power rankings for ${division} Week ${week}, cached at ${new Date(cachedData[cacheKey].timestamp).toLocaleString()}`);
      
      // Format the dates consistently to avoid "{object Object}" display
      const now = new Date();
      const nextUpdateTime = new Date(now.getTime() + CACHE_TTL);
      const formattedUpdateTime = new Date(cachedData[cacheKey].timestamp).toLocaleString('en-US', TIME_FORMAT_OPTIONS);
      const formattedNextUpdateTime = nextUpdateTime.toLocaleString('en-US', TIME_FORMAT_OPTIONS);
      const minutesUntilNextUpdate = Math.ceil((nextUpdateTime.getTime() - now.getTime()) / 60000);
      
      return {
        data: cachedData[cacheKey].data,
        cachedAt: cachedData[cacheKey].timestamp,
        fromCache: true,
        lastUpdated: formattedUpdateTime,
        formattedLastUpdated: formattedUpdateTime + " EST",
        nextUpdateFormatted: formattedNextUpdateTime + " EST",
        refreshInfo: {
          nextScheduledUpdate: nextUpdateTime.getTime(),
          lastUpdated: cachedData[cacheKey].timestamp,
          refreshInterval: "Hourly",
          formattedLastUpdated: formattedUpdateTime + " EST",
          nextUpdateFormatted: formattedNextUpdateTime + " EST",
          minutesUntilNextUpdate: minutesUntilNextUpdate
        }
      };
    }
    
    // Try the main sheet first
    let mainSheetError = null;
    let sheet = null;
    let doc = null;
    
    try {
      doc = await connectToGoogleSheet(POWER_RANKINGS_SHEET_ID);
      console.log(`Connected to main power rankings sheet: ${POWER_RANKINGS_SHEET_ID.substring(0, 6)}...`);
      
      // Try to find the sheet with the simpler, more reliable pattern matching
      sheet = findSheetByPattern(doc, formattedDivision, week);
      
      if (sheet) {
        console.log(`Found sheet in main document: "${sheet.title}" for Week ${week}`);
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
        
        // Try to find the sheet with the simpler pattern matching
        const divSheet = findSheetByPattern(divDoc, formattedDivision, week);
        
        if (divSheet) {
          console.log(`Found sheet in division-specific document: "${divSheet.title}"`);
          return await processFoundSheet(divSheet, division, week, cacheKey);
        }
      } catch (divError) {
        console.error(`Error with division-specific sheet: ${divError.message}`);
      }
    }
    
    // CRITICAL CHANGE: Remove all fallback logic that might use Week 1 data for other weeks
    // Instead, return a clean "not available" message
    
    // If we reach here, we've exhausted all options
    return {
      data: null,
      error: `Power rankings for ${division.toUpperCase()} Week ${week} are not available yet.`,
      notFound: true, // Add a flag to indicate this is truly not found
      requestedWeek: week
    };
    
    // Rest of error handling...
  } catch (error) {
    console.error('Error in fetchPowerRankings:', error);
    
    // Always check for cached data before returning an error
    const cacheKey = `${division.toLowerCase()}-week${week}`;
    if (cachedData[cacheKey]) {
      const now = new Date();
      const nextUpdateTime = new Date(now.getTime() + CACHE_TTL);
      const formattedUpdateTime = new Date(cachedData[cacheKey].timestamp).toLocaleString('en-US', TIME_FORMAT_OPTIONS);
      const formattedNextUpdateTime = nextUpdateTime.toLocaleString('en-US', TIME_FORMAT_OPTIONS);
      const minutesUntilNextUpdate = Math.ceil((nextUpdateTime.getTime() - now.getTime()) / 60000);
      
      console.log(`Fetch failed but returning cached data for ${division} Week ${week} from ${formattedUpdateTime}`);
      
      return {
        data: cachedData[cacheKey].data,
        cachedAt: cachedData[cacheKey].timestamp,
        fromCache: true,
        lastUpdated: formattedUpdateTime,
        formattedLastUpdated: formattedUpdateTime + " EST",
        nextUpdateFormatted: formattedNextUpdateTime + " EST",
        fetchError: "Using cached data - couldn't fetch fresh data",
        refreshInfo: {
          nextScheduledUpdate: nextUpdateTime.getTime(),
          lastUpdated: cachedData[cacheKey].timestamp,
          refreshInterval: "Hourly",
          formattedLastUpdated: formattedUpdateTime + " EST",
          nextUpdateFormatted: formattedNextUpdateTime + " EST", 
          minutesUntilNextUpdate: minutesUntilNextUpdate
        }
      };
    }
    
    // If no cache exists for this division/week, return a more user-friendly error
    return {
      data: null,
      error: `Power rankings data for ${division.toUpperCase()} Week ${week} is being prepared. Please check back soon.`,
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
    // CRITICAL: Verify that the sheet matches the requested division and week
    console.log(`Processing sheet "${sheet.title}" for ${division} Week ${week}`);
    
    // If the sheet object has matched values, verify they match the request
    if (sheet._matchedDivision && sheet._matchedWeek) {
      if (sheet._matchedWeek !== week) {
        console.error(`⚠️ WEEK MISMATCH: Sheet "${sheet.title}" was matched for Week ${sheet._matchedWeek} but was requested for Week ${week}`);
        throw new Error(`Wrong week data: Found sheet for Week ${sheet._matchedWeek} but requested Week ${week}`);
      }
    }
    
    let data = await extractPowerRankingsData(sheet);
    
    // Add this validation to ensure we're not mixing up data from different weeks
    console.log(`Extracted data has ${data.teams?.length || 0} teams and ${data.players?.length || 0} players`);
    
    // Mark the data with its source for debugging
    data._source = {
      sheetTitle: sheet.title,
      division: division,
      week: week,
      timestamp: new Date().toISOString()
    };
    
    // Normalize team names
    if (data.teams && data.teams.length > 0) {
      data.teams = data.teams.map(entry => ({
        ...entry,
        team: normalizeTeamName(entry.team),
      }));
    }
    
    // Cache the data with the correct week
    const timestamp = Date.now();
    console.log(`Caching data for ${division} Week ${week} with key: ${cacheKey}`);
    cachedData[cacheKey] = {
      data,
      timestamp,
      division,
      week
    };
    
    // Calculate the next update time (1 hour from now)
    const now = new Date();
    const nextUpdateTime = new Date(now.getTime() + CACHE_TTL);
    
    // Format times using EST timezone to avoid {object Object}
    const formattedUpdateTime = now.toLocaleString('en-US', TIME_FORMAT_OPTIONS);
    const formattedNextUpdateTime = nextUpdateTime.toLocaleString('en-US', TIME_FORMAT_OPTIONS);
    
    console.log(`Data for ${division} Week ${week} (${cacheKey}) updated at ${formattedUpdateTime} EST. Next refresh at ${formattedNextUpdateTime} EST`);
    
    // Calculate minutes until next update for frontend countdown
    const minutesUntilNextUpdate = Math.ceil((nextUpdateTime.getTime() - now.getTime()) / 60000);
    
    return {
      data,
      cachedAt: timestamp,
      fromCache: false,
      nextUpdateAt: nextUpdateTime.getTime(),
      lastUpdated: formattedUpdateTime, 
      formattedLastUpdated: formattedUpdateTime + " EST",
      nextUpdateFormatted: formattedNextUpdateTime + " EST",
      lastScheduledUpdate: now.getTime(),
      refreshInfo: {
        nextScheduledUpdate: nextUpdateTime.getTime(),
        lastUpdated: now.getTime(),
        refreshInterval: "Hourly",
        formattedLastUpdated: formattedUpdateTime + " EST",
        nextUpdateFormatted: formattedNextUpdateTime + " EST",
        minutesUntilNextUpdate: minutesUntilNextUpdate
      }
    };
  } catch (error) {
    console.error(`Error processing sheet data for ${division} Week ${week}:`, error);
    
    // Return a more helpful error
    throw new Error(`Failed to process ${division} Week ${week} data: ${error.message}`);
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

// Add these constants near the top
const TIME_ZONE = 'America/New_York'; // EST/EDT timezone
const TIME_FORMAT_OPTIONS = { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true, 
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric'
};

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

    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'majors';
    const week = parseInt(searchParams.get('week') || '1', 10);
    const isInitialLoad = searchParams.get('initialLoad') === 'true';
    
    // NEVER respect bypass parameter from frontend
    const bypassCache = false;
    
    // Check if request is for Majors division
    if (division.toLowerCase() === 'majors') {
      console.log(`Processing request for Majors Week ${week} [${requestId}]`);
    }
    
    debugLog(`Power Rankings API - Request received:`, {
      division,
      week,
      isInitialLoad,
      requestId,
      environment: process.env.NODE_ENV || 'development',
      isVercel: !!process.env.VERCEL
    });
    
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
    
    // Add this to the GET function, right before the fetchPowerRankings call
    // Clear any potentially incorrect cached data for this request
    const cacheKey = `${division.toLowerCase()}-week${week}`;
    if (division.toLowerCase() === 'majors' && week > 1) {
      // For Majors weeks beyond week 1, check if the cache might be showing week 1 data
      if (cachedData[cacheKey] && cachedData[cacheKey].week !== week) {
        console.log(`⚠️ Found incorrect cache for ${division} Week ${week}. Cache shows Week ${cachedData[cacheKey].week} data. Clearing cache.`);
        delete cachedData[cacheKey];
      }
    }

    // This line is critical - NEVER allow frontend to bypass cache
    const shouldBypassCache = false;
    
    // Normal flow for all divisions
    let result = await fetchPowerRankings(division, week, isInitialLoad, shouldBypassCache);
    
    // After fetchPowerRankings call, add validation to ensure week matches
    if (result.data && result.requestedWeek !== week) {
      console.error(`❌ DATA MISMATCH: Requested Week ${week} but got data for Week ${result.requestedWeek}`);
      // Return error instead of wrong week data
      result = {
        data: null,
        error: `Data mismatch error: Requested Week ${week} but received different week data.`,
        requestedWeek: week
      };
    }
    
    // Fix missing headers declaration
    const headers = {
      'Cache-Control': 'no-store, must-revalidate',
      'Expires': '0'
    };
    
    // Log what we're returning to ensure correct data
    console.log(`Returning ${division} Week ${week} data:`, {
      fromCache: result.fromCache,
      lastUpdated: result.formattedLastUpdated,
      hasData: !!result.data
    });
    
    // Add this before line 210 in the GET function 
    // After the API request parameters are parsed
    debugCacheKeys();
    console.log(`REQUEST: division=${division}, week=${week}, current cache keys: ${Object.keys(cachedData).join(', ')}`);

    // Add this right after the fetchPowerRankings call in the GET function
    console.log(`RESPONSE: division=${division}, week=${week}, fromCache=${result.fromCache}, data present=${!!result.data}`);
    debugCacheKeys();
    
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

// Helper function to get week name pattern for text-based week names
function getWeekNamePattern(week) {
  const weekNames = {
    1: 'one|first',
    2: 'two|second',
    3: 'three|third',
    4: 'four|fourth',
    5: 'five|fifth',
    6: 'six|sixth',
    7: 'seven|seventh',
    8: 'eight|eighth'
  };
  return weekNames[week] || week;
}
