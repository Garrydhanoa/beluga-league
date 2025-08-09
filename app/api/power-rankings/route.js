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
  
  // Refresh if:
  // 1. Server was just deployed/restarted
  // 2. Cache is older than TTL (1 hour)
  
  const processStartTime = process.env.SERVER_START_TIME ? parseInt(process.env.SERVER_START_TIME, 10) : null;
  const isServerRestart = processStartTime && (now.getTime() - processStartTime < 120000); // Within 2 minutes of server start
  
  if (isServerRestart) {
    console.log(`Cache refresh needed for ${cacheKey}: Server was just deployed or restarted`);
    return true;
  }
  
  // If the cache is older than the TTL (1 hour), refresh it
  if (cacheAge > CACHE_TTL) {
    const cacheAgeMinutes = Math.floor(cacheAge / 60000);
    console.log(`Cache refresh needed for ${cacheKey}: Cache is ${cacheAgeMinutes} minutes old (older than 60 minutes)`);
    return true;
  }
  
  // Cache is still fresh, no need to refresh
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
    
    // Check if we have valid cached data
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
    
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'majors';
    const week = parseInt(searchParams.get('week') || '1', 10);
    const isInitialLoad = searchParams.get('initialLoad') === 'true';
    
    // IMPORTANT FIX: NEVER respect the bypass parameter from frontend
    // Always use the server-side cache management
    const bypassCache = false; // Never bypass cache based on client request
    
    debugLog(`Power Rankings API - Request received:`, {
      division,
      week,
      isInitialLoad,
      environment: process.env.NODE_ENV || 'development',
      isVercel: !!process.env.VERCEL
    });
    
    // REMOVE this section to prevent frontend from clearing cache
    // if (bypassCache && division === 'majors') {
    //   debugLog(`Clearing all cached Majors data due to bypass request`);
    //   for (let w = 1; w <= 8; w++) {
    //     const weekCacheKey = `majors-week${w}`;
    //     if (cachedData[weekCacheKey]) {
    //       delete cachedData[weekCacheKey];
    //       debugLog(`Deleted cache for ${weekCacheKey}`);
    //     }
    //   }
    // }
    
    // Rest of the code remains the same
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
    
    // This line is critical - NEVER allow frontend to bypass cache
    const shouldBypassCache = false;
    
    // Special case for Majors division on Vercel
    if (process.env.VERCEL && division === 'majors' && MAJORS_SHEET_NAMES[week]) {
      // ... (existing code)
    } else {
      // Normal flow for non-Majors or local development
      result = await fetchPowerRankings(division, week, isInitialLoad, shouldBypassCache);
    }
    
    // ... (rest of your code)
    
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
