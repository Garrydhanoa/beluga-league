import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

// Cache mechanism
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let cachedData = {};

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

// Set the time when data should be considered updated (9 PM Eastern Time)
const UPDATE_HOUR_EST = 21; // 9 PM EST

// Function to check if the cache needs to be refreshed based on 9 PM EST schedule
function shouldRefreshCache(cacheKey, isInitialLoad = false) {
  // If no cache exists, definitely refresh
  if (!cachedData[cacheKey]) {
    return true;
  }
  
  // Get current time in EST
  const now = new Date();
  const estOptions = { timeZone: 'America/New_York' };
  const estDate = new Date(now.toLocaleString('en-US', estOptions));
  const estHour = estDate.getHours();
  
  // Get the timestamp of when the cache was last updated
  const lastUpdateTime = new Date(cachedData[cacheKey].timestamp);
  const lastUpdateDate = new Date(lastUpdateTime.toLocaleString('en-US', estOptions));
  
  // Only refresh the cache if:
  // 1. It's a server restart/deployment (the server process is fresh)
  // 2. It's after 9 PM EST and the cache was last updated before 9 PM today
  
  // For a deployment, the Node.js process is fresh, so we'll refresh once
  const processStartTime = process.env.SERVER_START_TIME ? parseInt(process.env.SERVER_START_TIME, 10) : null;
  const isServerRestart = processStartTime && (now.getTime() - processStartTime < 120000); // Within 2 minutes of server start
  
  // If this is a server restart/deployment, refresh the cache
  if (isServerRestart) {
    console.log(`Cache refresh needed for ${cacheKey}: Server was just deployed or restarted`);
    return true;
  }
  
  // If it's after 9 PM EST and the cache was last updated before 9 PM today, refresh
  if (estHour >= UPDATE_HOUR_EST && 
      (lastUpdateDate.getDate() !== estDate.getDate() || 
       lastUpdateDate.getHours() < UPDATE_HOUR_EST)) {
    console.log(`Cache refresh needed for ${cacheKey}: It's after ${UPDATE_HOUR_EST}:00 EST and cache is from before today's update time`);
    return true;
  }
  
  // If it's before 9 PM EST and the cache is from yesterday or earlier, refresh
  if (estHour < UPDATE_HOUR_EST && 
      lastUpdateDate.getDate() !== estDate.getDate()) {
    console.log(`Cache refresh needed for ${cacheKey}: Cache is from a previous day`);
    return true;
  }
  
  // Otherwise, no need to refresh
  return false;
}

// Get credentials from environment variables
async function getCredentials() {
  try {
    // Check for environment variables first - check both variable names for compatibility
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // Debug environment variables (safely, not showing full key)
    console.log('Environment check:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`- VERCEL: ${process.env.VERCEL ? 'Yes' : 'No'}`);
    console.log(`- Has GOOGLE_CLIENT_EMAIL: ${!!process.env.GOOGLE_CLIENT_EMAIL}`);
    console.log(`- Has GOOGLE_SERVICE_ACCOUNT_EMAIL: ${!!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    console.log(`- Has GOOGLE_PRIVATE_KEY: ${!!process.env.GOOGLE_PRIVATE_KEY}`);
    console.log(`- POWER_RANKINGS_SHEET_ID: ${POWER_RANKINGS_SHEET_ID ? POWER_RANKINGS_SHEET_ID.substring(0, 6) + '...' : 'not set'}`);
    
    if (clientEmail && privateKey) {
      console.log(`Using credentials from environment variables for: ${clientEmail.substring(0, 5)}...`);
      console.log(`Private key starts with: ${privateKey.substring(0, 12)}...`);
      
      // Check if the private key contains expected format
      const hasProperFormat = privateKey.includes('-----BEGIN PRIVATE KEY-----');
      console.log(`Private key appears properly formatted: ${hasProperFormat}`);
      
      return {
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'), // Fix for escaped newlines in env var
      };
    }

    // In production (Vercel), we should only use environment variables
    if (process.env.VERCEL) {
      console.error('No credentials in environment variables on Vercel. Make sure you have set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in your Vercel project settings.');
      return null;
    }
    
    // In development, we can try to use credentials.json as fallback
    // but only during local development, not on Vercel
    console.log('Attempting to load credentials from credentials.json');
    
    try {
      // For local development only, using dynamic import
      if (typeof process !== 'undefined' && process.cwd) {
        // We're in Node.js environment
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const credentialsPath = path.join(process.cwd(), 'credentials.json');
        const data = await fs.readFile(credentialsPath, 'utf8');
        const credentials = JSON.parse(data);
        return { email: credentials.client_email, key: credentials.private_key };
      } else {
        console.error('Not in Node.js environment, cannot load credentials from file');
        return null;
      }
    } catch (e) {
      console.error('Failed to load credentials.json:', e);
      return null;
    }
  } catch (e) {
    console.error('Error getting credentials:', e);
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
      // Special case for Vercel - try without any case sensitivity
      new RegExp(`^.*[Mm][Aa][Jj][Oo][Rr][Ss]?.*W.*${week}.*$`, 'i'),
      // Try with "Division" in the name
      new RegExp(`^.*[Mm][Aa][Jj][Oo][Rr][Ss]?.*[Dd]ivision.*W.*${week}.*$`, 'i'),
      // Even more flexible pattern - just look for "major" and the week number anywhere
      new RegExp(`^.*[Mm][Aa][Jj][Oo][Rr].*${week}.*$`, 'i'),
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
      
      // Case 2: If the title contains "m" and the week number (extreme fallback)
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
    
    // Also load historical ranking data if available (columns K-S)
    try {
      await sheet.loadCells('K21:S30'); // Historical team rankings across weeks
    } catch (e) {
      console.log('No historical rankings available', e);
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
        
        // Try to extract historical rankings (columns K-S for weeks 1-9)
        const teamHistory = [];
        try {
          for (let weekCol = 10; weekCol <= 18; weekCol++) { // Columns K-S (10-18 in 0-indexed)
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
        
        teams.push(team);
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
async function fetchPowerRankings(division, week, isInitialLoad = false) {
  try {
    // Format division for sheet lookup - be more flexible with sheet naming
    let formattedDivision;
    if (division.toLowerCase() === 'majors') {
      // For Majors, we'll use multiple patterns with different capitalizations
      // in the findSheetByPattern function, so just preserve the lowercase version
      formattedDivision = 'majors';
      console.log('Handling Majors division with enhanced case sensitivity matching');
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
      for (let i = 0; i < doc.sheetCount; i++) {
        if (doc.sheetsByIndex[i].title.toLowerCase().includes(division.toLowerCase())) {
          foundSheets.push(doc.sheetsByIndex[i].title);
        }
      }
      
      if (foundSheets.length > 0) {
        console.log(`Found some sheets that might be related: ${foundSheets.join(', ')}`);
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
    
    // Get current date in Eastern Time for data update tracking
    const now = new Date();
    const estOptions = { timeZone: 'America/New_York' };
    const estDate = new Date(now.toLocaleString('en-US', estOptions));
    
    // Calculate the next update time (9 PM EST today or tomorrow)
    const nextUpdateDate = new Date(estDate);
    nextUpdateDate.setHours(UPDATE_HOUR_EST, 0, 0, 0);
    
    // If current time is past 9 PM EST, next update is tomorrow
    if (estDate.getHours() >= UPDATE_HOUR_EST) {
      nextUpdateDate.setDate(nextUpdateDate.getDate() + 1);
    }
    
    return {
      data,
      cachedAt: timestamp,
      fromCache: false,
      nextUpdateAt: nextUpdateDate.getTime(),
      lastScheduledUpdate: estDate.getHours() >= UPDATE_HOUR_EST ? 
        new Date(estDate.setHours(UPDATE_HOUR_EST, 0, 0, 0)).getTime() : 
        new Date(estDate.setDate(estDate.getDate() - 1)).setHours(UPDATE_HOUR_EST, 0, 0, 0)
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
      console.log(`Setting initial server start time: ${process.env.SERVER_START_TIME}`);
    }

    const url = new URL(request.url);
    const division = url.searchParams.get('division')?.toLowerCase() || 'majors';
    const week = parseInt(url.searchParams.get('week') || '1', 10);
    
    // Check if this is an initial load request from the client
    // This is used to detect if the user is loading the page for the first time
    // or if they're trying to force a refresh by clearing their localStorage
    const isInitialLoad = url.searchParams.get('initialLoad') === 'true';
    
    console.log(`Power Rankings API - Request received: division=${division}, week=${week}, initialLoad=${isInitialLoad}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}, Vercel: ${process.env.VERCEL ? 'Yes' : 'No'}`);
    
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
    
    console.log(`API: Fetching power rankings for ${division} division, Week ${week}`);
    console.log(`Using sheet ID: ${POWER_RANKINGS_SHEET_ID}`);
    const result = await fetchPowerRankings(division, week, isInitialLoad);
    
    if (result.error) {
      // This is not a server error, just data isn't available yet
      return NextResponse.json(result, { status: 200 });
    }
    
    // Add information about daily refresh time
    const now = new Date();
    const estOptions = { timeZone: 'America/New_York' };
    const estDate = new Date(now.toLocaleString('en-US', estOptions));
    
    // Calculate next 9 PM EST update time
    const nextUpdateDate = new Date(estDate);
    nextUpdateDate.setHours(UPDATE_HOUR_EST, 0, 0, 0);
    if (estDate.getHours() >= UPDATE_HOUR_EST) {
      nextUpdateDate.setDate(nextUpdateDate.getDate() + 1);
    }
    
    result.refreshInfo = {
      dailyUpdateTime: `${UPDATE_HOUR_EST}:00 EST`, // 9:00 PM EST
      nextScheduledUpdate: nextUpdateDate.toISOString(),
      lastUpdated: result.cachedAt ? new Date(result.cachedAt).toISOString() : new Date().toISOString()
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
      return NextResponse.json({
        error: 'Authentication error: Google Sheets API',
        message: 'The application is unable to authenticate with Google Sheets API. Please ensure your environment variables are properly set.',
        details: error.message,
        troubleshooting: 'Verify that GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are correctly set in your Vercel project settings.',
        environmentInfo: {
          hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasGoogleServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          isPowerRankingsSheetIdSet: !!POWER_RANKINGS_SHEET_ID,
          sheetIdPrefix: POWER_RANKINGS_SHEET_ID ? POWER_RANKINGS_SHEET_ID.substring(0, 6) + '...' : 'not set'
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
