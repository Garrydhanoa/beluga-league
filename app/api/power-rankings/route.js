import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

// Cache mechanism
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let cachedData = {};

const POWER_RANKINGS_SHEET_ID = '1wU4Za1xjl_VZwIlaJPeFgP0JRlrOxscJZb0MADxX5CE';
const DIVISIONS = ['aa', 'aaa', 'majors'];
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];

// Set the time when data should be considered updated (9 PM Eastern Time)
const UPDATE_HOUR_EST = 21; // 9 PM EST

// Get credentials from environment variables
async function getCredentials() {
  try {
    // Check for environment variables first
    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    ) {
      console.log('Using credentials from environment variables');
      return {
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix for escaped newlines in env var
      };
    }

    // In production (Vercel), we should only use environment variables
    if (process.env.VERCEL) {
      console.error('No credentials in environment variables on Vercel');
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

// Function to find a sheet that matches the pattern (e.g., "AA W1", "AAA W2")
function findSheetByPattern(doc, division, week) {
  const pattern = new RegExp(`^${division}\\s*W${week}$`, 'i'); // Case insensitive
  
  for (let i = 0; i < doc.sheetCount; i++) {
    const sheet = doc.sheetsByIndex[i];
    if (pattern.test(sheet.title.trim())) {
      return sheet;
    }
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
async function fetchPowerRankings(division, week) {
  try {
    // Format division for sheet lookup
    let formattedDivision = division.toUpperCase();
    if (formattedDivision === 'MAJORS') {
      formattedDivision = 'Majors';
    }
    
    console.log(`Fetching power rankings for ${formattedDivision} Week ${week}`);
    
    // Check cache first
    const cacheKey = `${division}-week${week}`;
    if (
      cachedData[cacheKey] &&
      cachedData[cacheKey].timestamp > Date.now() - CACHE_TTL
    ) {
      console.log(`Using cached power rankings for ${division} Week ${week}`);
      return {
        data: cachedData[cacheKey].data,
        cachedAt: cachedData[cacheKey].timestamp,
        fromCache: true,
      };
    }
    
    const doc = await connectToGoogleSheet(POWER_RANKINGS_SHEET_ID);
    const sheet = findSheetByPattern(doc, formattedDivision, week);
    
    if (!sheet) {
      console.log(`No sheet found for ${formattedDivision} Week ${week}`);
      return {
        data: null,
        error: `Power rankings for ${division.toUpperCase()} Week ${week} are not available yet. They will be released during Week ${week}.`,
      };
    }
    
    const data = await extractPowerRankingsData(sheet);
    
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
    const url = new URL(request.url);
    const division = url.searchParams.get('division')?.toLowerCase() || 'majors';
    const week = parseInt(url.searchParams.get('week') || '1', 10);
    
    // Validate division
    if (!DIVISIONS.includes(division)) {
      return NextResponse.json(
        { error: `Invalid division: ${division}. Valid options are: aa, aaa, majors` },
        { status: 400 }
      );
    }
    
    // Validate week
    if (!WEEKS.includes(week)) {
      return NextResponse.json(
        { error: `Invalid week: ${week}. Valid options are: 1-8` },
        { status: 400 }
      );
    }
    
    console.log(`API: Fetching power rankings for ${division} division, Week ${week}`);
    const result = await fetchPowerRankings(division, week);
    
    if (result.error) {
      // This is not a server error, just data isn't available yet
      return NextResponse.json(result, { status: 200 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in power-rankings API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power rankings', details: error.message },
      { status: 500 }
    );
  }
}
