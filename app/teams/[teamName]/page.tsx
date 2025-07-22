"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Type definitions
type Match = [string, string]; // [team1, team2]
type WeekSchedule = Match[];
type DivisionSchedule = {
  [week: string]: WeekSchedule;
};
type Division = "major" | "aa" | "aaa";

export default function TeamPage() {
  const params = useParams();
  const teamName = params.teamName as string;
  const decodedTeamName = decodeURIComponent(teamName);
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'stats'>('schedule');
  const [activeScheduleTab, setActiveScheduleTab] = useState<Division>("aa");
  const [teamDivisions, setTeamDivisions] = useState<Division[]>([]);
  const [teamSchedules, setTeamSchedules] = useState<{
    [key in Division]?: {[week: string]: Match[]}
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);

  // Create schedules data (same as in schedules page)
  const majorsSchedule: DivisionSchedule = {
    "Week 1": [
      ["Acid Esports", "Sublunary"],
      ["Valkyries", "Lotus"],
      ["Malfeasance", "Panthers"],
      ["Wizards", "Surge"],
      ["InTraCate", "Fallen Angels"],
      ["Archangels", "Aviators"],
      ["Sublunary", "Lotus"],
      ["Acid Esports", "Malfeasance"],
      ["Surge", "Valkyries"],
      ["Panthers", "InTraCate"],
      ["Aviators", "Wizards"],
      ["Fallen Angels", "Archangels"]
    ],
    "Week 2": [
      ["Malfeasance", "Sublunary"],
      ["Lotus", "Surge"],
      ["InTraCate", "Acid Esports"],
      ["Valkyries", "Aviators"],
      ["Archangels", "Panthers"],
      ["Wizards", "Fallen Angels"],
      ["Sublunary", "Surge"],
      ["Malfeasance", "InTraCate"],
      ["Aviators", "Lotus"],
      ["Acid Esports", "Archangels"],
      ["Fallen Angels", "Valkyries"],
      ["Panthers", "Wizards"]
    ],
    "Week 3": [
      ["InTraCate", "Sublunary"],
      ["Surge", "Aviators"],
      ["Archangels", "Malfeasance"],
      ["Lotus", "Fallen Angels"],
      ["Wizards", "Acid Esports"],
      ["Valkyries", "Panthers"],
      ["Sublunary", "Aviators"],
      ["InTraCate", "Archangels"],
      ["Fallen Angels", "Surge"],
      ["Malfeasance", "Wizards"],
      ["Panthers", "Lotus"],
      ["Acid Esports", "Valkyries"]
    ],
    "Week 4": [
      ["Archangels", "Sublunary"],
      ["Aviators", "Fallen Angels"],
      ["Wizards", "InTraCate"],
      ["Surge", "Panthers"],
      ["Valkyries", "Malfeasance"],
      ["Lotus", "Acid Esports"],
      ["Sublunary", "Fallen Angels"],
      ["Archangels", "Wizards"],
      ["Panthers", "Aviators"],
      ["InTraCate", "Valkyries"],
      ["Acid Esports", "Surge"],
      ["Malfeasance", "Lotus"]
    ],
    "Week 5": [
      ["Wizards", "Sublunary"],
      ["Fallen Angels", "Panthers"],
      ["Valkyries", "Archangels"],
      ["Aviators", "Acid Esports"],
      ["Lotus", "InTraCate"],
      ["Surge", "Malfeasance"],
      ["Sublunary", "Panthers"],
      ["Wizards", "Valkyries"],
      ["Acid Esports", "Fallen Angels"],
      ["Archangels", "Lotus"],
      ["Malfeasance", "Aviators"],
      ["InTraCate", "Surge"]
    ],
    "Week 6": [
      ["Valkyries", "Sublunary"],
      ["Panthers", "Acid Esports"],
      ["Lotus", "Wizards"],
      ["Fallen Angels", "Malfeasance"],
      ["Surge", "Archangels"],
      ["Aviators", "InTraCate"],
      ["Acid Esports", "Sublunary"],
      ["Valkyries", "Lotus"],
      ["Malfeasance", "Panthers"],
      ["Wizards", "Surge"],
      ["InTraCate", "Fallen Angels"],
      ["Archangels", "Aviators"]
    ],
    "Week 7": [
      ["Sublunary", "Lotus"],
      ["Acid Esports", "Malfeasance"],
      ["Surge", "Valkyries"],
      ["Panthers", "InTraCate"],
      ["Aviators", "Wizards"],
      ["Fallen Angels", "Archangels"],
      ["Malfeasance", "Sublunary"],
      ["Lotus", "Surge"],
      ["InTraCate", "Acid Esports"],
      ["Valkyries", "Aviators"],
      ["Archangels", "Panthers"],
      ["Wizards", "Fallen Angels"]
    ],
    "Week 8": [
      ["Sublunary", "Surge"],
      ["Malfeasance", "InTraCate"],
      ["Aviators", "Lotus"],
      ["Acid Esports", "Archangels"],
      ["Fallen Angels", "Valkyries"],
      ["Panthers", "Wizards"],
      ["InTraCate", "Sublunary"],
      ["Surge", "Aviators"],
      ["Archangels", "Malfeasance"],
      ["Lotus", "Fallen Angels"],
      ["Wizards", "Acid Esports"],
      ["Valkyries", "Panthers"]
    ]
  };

  const aaaaaSchedule: DivisionSchedule = {
    "Week 1": [
      ["Lotus", "Malfeasance"],
      ["MNML", "InTraCate"],
      ["Acid Esports", "Sublunary"],
      ["Kingdom", "Panthers"],
      ["Surge", "Alchemy Esports"],
      ["Immortals", "Fallen Angels"],
      ["Valkyries", "Archangels"],
      ["Aviators", "Wizards"],
      ["Malfeasance", "InTraCate"],
      ["Lotus", "Acid Esports"],
      ["Panthers", "MNML"],
      ["Sublunary", "Surge"],
      ["Fallen Angels", "Kingdom"],
      ["Alchemy Esports", "Valkyries"],
      ["Wizards", "Immortals"],
      ["Archangels", "Aviators"]
    ],
    "Week 2": [
      ["Acid Esports", "Malfeasance"],
      ["InTraCate", "Panthers"],
      ["Surge", "Lotus"],
      ["MNML", "Fallen Angels"],
      ["Valkyries", "Sublunary"],
      ["Kingdom", "Wizards"],
      ["Aviators", "Alchemy Esports"],
      ["Immortals", "Archangels"],
      ["Malfeasance", "Panthers"],
      ["Acid Esports", "Surge"],
      ["Fallen Angels", "InTraCate"],
      ["Lotus", "Valkyries"],
      ["Wizards", "MNML"],
      ["Sublunary", "Aviators"],
      ["Archangels", "Kingdom"],
      ["Alchemy Esports", "Immortals"]
    ],
    "Week 3": [
      ["Surge", "Malfeasance"],
      ["Panthers", "Fallen Angels"],
      ["Valkyries", "Acid Esports"],
      ["InTraCate", "Wizards"],
      ["Aviators", "Lotus"],
      ["MNML", "Archangels"],
      ["Immortals", "Sublunary"],
      ["Kingdom", "Alchemy Esports"],
      ["Malfeasance", "Fallen Angels"],
      ["Surge", "Valkyries"],
      ["Wizards", "Panthers"],
      ["Acid Esports", "Aviators"],
      ["Archangels", "InTraCate"],
      ["Lotus", "Immortals"],
      ["Alchemy Esports", "MNML"],
      ["Sublunary", "Kingdom"]
    ],
    "Week 4": [
      ["Valkyries", "Malfeasance"],
      ["Fallen Angels", "Wizards"],
      ["Aviators", "Surge"],
      ["Panthers", "Archangels"],
      ["Immortals", "Acid Esports"],
      ["InTraCate", "Alchemy Esports"],
      ["Kingdom", "Lotus"],
      ["MNML", "Sublunary"],
      ["Malfeasance", "Wizards"],
      ["Valkyries", "Aviators"],
      ["Archangels", "Fallen Angels"],
      ["Surge", "Immortals"],
      ["Alchemy Esports", "Panthers"],
      ["Acid Esports", "Kingdom"],
      ["Sublunary", "InTraCate"],
      ["Lotus", "MNML"]
    ],
    "Week 5": [
      ["Aviators", "Malfeasance"],
      ["Wizards", "Archangels"],
      ["Immortals", "Valkyries"],
      ["Fallen Angels", "Alchemy Esports"],
      ["Kingdom", "Surge"],
      ["Panthers", "Sublunary"],
      ["MNML", "Acid Esports"],
      ["InTraCate", "Lotus"],
      ["Malfeasance", "Archangels"],
      ["Aviators", "Immortals"],
      ["Alchemy Esports", "Wizards"],
      ["Valkyries", "Kingdom"],
      ["Sublunary", "Fallen Angels"],
      ["Surge", "MNML"],
      ["Lotus", "Panthers"],
      ["Acid Esports", "InTraCate"]
    ],
    "Week 6": [
      ["Immortals", "Malfeasance"],
      ["Archangels", "Alchemy Esports"],
      ["Kingdom", "Aviators"],
      ["Wizards", "Sublunary"],
      ["MNML", "Valkyries"],
      ["Fallen Angels", "Lotus"],
      ["InTraCate", "Surge"],
      ["Panthers", "Acid Esports"],
      ["Malfeasance", "Alchemy Esports"],
      ["Immortals", "Kingdom"],
      ["Sublunary", "Archangels"],
      ["Aviators", "MNML"],
      ["Lotus", "Wizards"],
      ["Valkyries", "InTraCate"],
      ["Acid Esports", "Fallen Angels"],
      ["Surge", "Panthers"]
    ],
    "Week 7": [
      ["Kingdom", "Malfeasance"],
      ["Alchemy Esports", "Sublunary"],
      ["MNML", "Immortals"],
      ["Archangels", "Lotus"],
      ["InTraCate", "Aviators"],
      ["Wizards", "Acid Esports"],
      ["Panthers", "Valkyries"],
      ["Fallen Angels", "Surge"],
      ["Malfeasance", "Sublunary"],
      ["Kingdom", "MNML"],
      ["Lotus", "Alchemy Esports"],
      ["Immortals", "InTraCate"],
      ["Acid Esports", "Archangels"],
      ["Aviators", "Panthers"],
      ["Surge", "Wizards"],
      ["Valkyries", "Fallen Angels"]
    ],
    "Week 8": [
      ["MNML", "Malfeasance"],
      ["Sublunary", "Lotus"],
      ["InTraCate", "Kingdom"],
      ["Alchemy Esports", "Acid Esports"],
      ["Panthers", "Immortals"],
      ["Archangels", "Surge"],
      ["Fallen Angels", "Aviators"],
      ["Wizards", "Valkyries"],
      ["Lotus", "Malfeasance"],
      ["MNML", "InTraCate"],
      ["Acid Esports", "Sublunary"],
      ["Kingdom", "Panthers"],
      ["Surge", "Alchemy Esports"],
      ["Immortals", "Fallen Angels"],
      ["Valkyries", "Archangels"],
      ["Aviators", "Wizards"]
    ]
  };

  const aaSchedule: DivisionSchedule = {
    "Week 1": [
      ["Acid Esports", "Sublunary"],
      ["Valkyries", "Lotus"],
      ["Malfeasance", "Panthers"],
      ["Wizards", "Surge"],
      ["InTraCate", "Fallen Angels"],
      ["Archangels", "Aviators"],
      ["Sublunary", "Lotus"],
      ["Acid Esports", "Malfeasance"],
      ["Surge", "Valkyries"],
      ["Panthers", "InTraCate"],
      ["Aviators", "Wizards"],
      ["Fallen Angels", "Archangels"]
    ],
    "Week 2": [
      ["Malfeasance", "Sublunary"],
      ["Lotus", "Surge"],
      ["InTraCate", "Acid Esports"],
      ["Valkyries", "Aviators"],
      ["Archangels", "Panthers"],
      ["Wizards", "Fallen Angels"],
      ["Sublunary", "Surge"],
      ["Malfeasance", "InTraCate"],
      ["Aviators", "Lotus"],
      ["Acid Esports", "Archangels"],
      ["Fallen Angels", "Valkyries"],
      ["Panthers", "Wizards"]
    ],
    "Week 3": [
      ["InTraCate", "Sublunary"],
      ["Surge", "Aviators"],
      ["Archangels", "Malfeasance"],
      ["Lotus", "Fallen Angels"],
      ["Wizards", "Acid Esports"],
      ["Valkyries", "Panthers"],
      ["Sublunary", "Aviators"],
      ["InTraCate", "Archangels"],
      ["Fallen Angels", "Surge"],
      ["Malfeasance", "Wizards"],
      ["Panthers", "Lotus"],
      ["Acid Esports", "Valkyries"]
    ],
    "Week 4": [
      ["Archangels", "Sublunary"],
      ["Aviators", "Fallen Angels"],
      ["Wizards", "InTraCate"],
      ["Surge", "Panthers"],
      ["Valkyries", "Malfeasance"],
      ["Lotus", "Acid Esports"],
      ["Sublunary", "Fallen Angels"],
      ["Archangels", "Wizards"],
      ["Panthers", "Aviators"],
      ["InTraCate", "Valkyries"],
      ["Acid Esports", "Surge"],
      ["Malfeasance", "Lotus"]
    ],
    "Week 5": [
      ["Wizards", "Sublunary"],
      ["Fallen Angels", "Panthers"],
      ["Valkyries", "Archangels"],
      ["Aviators", "Acid Esports"],
      ["Lotus", "InTraCate"],
      ["Surge", "Malfeasance"],
      ["Sublunary", "Panthers"],
      ["Wizards", "Valkyries"],
      ["Acid Esports", "Fallen Angels"],
      ["Archangels", "Lotus"],
      ["Malfeasance", "Aviators"],
      ["InTraCate", "Surge"]
    ],
    "Week 6": [
      ["Valkyries", "Sublunary"],
      ["Panthers", "Acid Esports"],
      ["Lotus", "Wizards"],
      ["Fallen Angels", "Malfeasance"],
      ["Surge", "Archangels"],
      ["Aviators", "InTraCate"],
      ["Acid Esports", "Sublunary"],
      ["Valkyries", "Lotus"],
      ["Malfeasance", "Panthers"],
      ["Wizards", "Surge"],
      ["InTraCate", "Fallen Angels"],
      ["Archangels", "Aviators"]
    ],
    "Week 7": [
      ["Sublunary", "Lotus"],
      ["Acid Esports", "Malfeasance"],
      ["Surge", "Valkyries"],
      ["Panthers", "InTraCate"],
      ["Aviators", "Wizards"],
      ["Fallen Angels", "Archangels"],
      ["Malfeasance", "Sublunary"],
      ["Lotus", "Surge"],
      ["InTraCate", "Acid Esports"],
      ["Valkyries", "Aviators"],
      ["Archangels", "Panthers"],
      ["Wizards", "Fallen Angels"]
    ],
    "Week 8": [
      ["Sublunary", "Surge"],
      ["Malfeasance", "InTraCate"],
      ["Aviators", "Lotus"],
      ["Acid Esports", "Archangels"],
      ["Fallen Angels", "Valkyries"],
      ["Panthers", "Wizards"],
      ["InTraCate", "Sublunary"],
      ["Surge", "Aviators"],
      ["Archangels", "Malfeasance"],
      ["Lotus", "Fallen Angels"],
      ["Wizards", "Acid Esports"],
      ["Valkyries", "Panthers"]
    ]
  };

  useEffect(() => {
    // Find all matches for this team across different divisions
    setIsLoading(true);
    
    // Create schedule objects for each division
    const schedules: {[key in Division]?: {[week: string]: Match[]}} = {
      major: {},
      aa: {},
      aaa: {}
    };
    
    // Track which divisions this team plays in
    const divisions: Division[] = [];
    
    // Check majors division - this should be unique
    let isInMajors = false;
    Object.entries(majorsSchedule).forEach(([week, matches]) => {
      const teamMatches = matches.filter(match => 
        match[0] === decodedTeamName || match[1] === decodedTeamName
      );
      
      if (teamMatches.length > 0) {
        if (!schedules.major) schedules.major = {};
        schedules.major[week] = teamMatches;
        isInMajors = true;
      }
    });
    if (isInMajors) divisions.push("major");
    
    // Check AAA division - this should be the same as AA
    let isInAAA = false;
    Object.entries(aaaaaSchedule).forEach(([week, matches]) => {
      const teamMatches = matches.filter(match => 
        match[0] === decodedTeamName || match[1] === decodedTeamName
      );
      
      if (teamMatches.length > 0) {
        if (!schedules.aaa) schedules.aaa = {};
        schedules.aaa[week] = teamMatches;
        isInAAA = true;
      }
    });
    if (isInAAA) divisions.push("aaa");
    
    // Check AA division - use aaaaaSchedule instead of aaSchedule
    let isInAA = false;
    // Use aaaaaSchedule for AA division, not aaSchedule
    Object.entries(aaaaaSchedule).forEach(([week, matches]) => {
      const teamMatches = matches.filter(match => 
        match[0] === decodedTeamName || match[1] === decodedTeamName
      );
      
      if (teamMatches.length > 0) {
        if (!schedules.aa) schedules.aa = {};
        schedules.aa[week] = teamMatches;
        isInAA = true;
      }
    });
    if (isInAA) divisions.push("aa");
    
    // After all divisions are gathered, sort them in the desired order: AA → AAA → MAJOR
    const sortedDivisions: Division[] = [];
    if (divisions.includes("aa")) sortedDivisions.push("aa" as Division);
    if (divisions.includes("aaa")) sortedDivisions.push("aaa" as Division);
    if (divisions.includes("major")) sortedDivisions.push("major" as Division);
    
    setTeamDivisions(sortedDivisions);
    setTeamSchedules(schedules);
    
    // Set default active schedule tab to the first available division
    if (sortedDivisions.length > 0) {
      setActiveScheduleTab(sortedDivisions[0]);
    }
    
    setIsLoading(false);
    
    // Trigger animations after load
    setTimeout(() => {
      setAnimateItems(true);
    }, 100);
  }, [decodedTeamName]);

  // Helper function to get team initials for fallback
  const getTeamInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('');
  };
  
  // Get the display name for a division
  const getDivisionDisplayName = (division: Division) => {
    switch(division) {
      case 'major': return 'MAJOR';
      case 'aa': return 'AA';
      case 'aaa': return 'AAA';
      default: return (division as string).toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" data-speed="0.03"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" data-speed="0.05"></div>
        <div className="bg-decor absolute top-1/4 right-1/4 w-40 h-40 rounded-full bg-blue-400/5 blur-2xl" data-speed="0.02"></div>
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl" data-speed="0.04"></div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="w-full bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <div className="relative w-[55px] h-[55px] rounded-full border-2 border-blue-400 overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/40 transition-all duration-300"></div>
                <img 
                  src="/logos/league_logo.png" 
                  alt="Beluga League" 
                  className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = ''; 
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement.innerHTML = '<span class="text-white font-bold text-2xl">BL</span>';
                    }
                  }}
                />
              </div>
            </Link>
            <Link href="/">
              <div className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-300 to-purple-400 text-transparent bg-clip-text inline-block">
                  Beluga League
                </span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8 text-white">
            <Link
              href="/"
              className="font-medium hover:text-blue-300 transition-colors duration-300 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/schedules"
              className="font-medium hover:text-blue-300 transition-colors duration-300 relative group"
            >
              Schedules
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/standings"
              className="font-medium hover:text-blue-300 transition-colors duration-300 relative group"
            >
              Standings
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/rankings"
              className="font-medium hover:text-blue-300 transition-colors duration-300 relative group"
            >
              Power Rankings
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/players"
              className="font-medium hover:text-blue-300 transition-colors duration-300 relative group"
            >
              Player Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>
        </div>
      </nav>

      <div className={`container mx-auto px-4 py-10 transition-all duration-700 ${animateItems ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        {/* Team header */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 mb-10">
          <div className="w-40 h-40 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse-slow"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 transform scale-110 blur-md"></div>
            <img 
              src={`/logos/${decodedTeamName}.png`} 
              alt={`${decodedTeamName} Logo`} 
              className="w-4/5 h-4/5 object-contain relative z-10 drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-600/30', 'via-purple-600/30', 'to-blue-900/30', 'border', 'border-white/20', 'flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse-slow"></div>
                    <span class="relative z-10 text-5xl font-bold text-white opacity-90">${getTeamInitials(decodedTeamName)}</span>
                  `;
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
                {decodedTeamName}
              </span>
              <span className="absolute -left-2 -top-2 text-blue-500 opacity-20 blur-sm">
                {decodedTeamName}
              </span>
              <span className="absolute -right-2 -bottom-2 text-purple-500 opacity-20 blur-sm">
                {decodedTeamName}
              </span>
            </h1>
            <div className="mt-3 bg-black/30 backdrop-blur-sm rounded-lg py-2 px-4 inline-flex">
              <p className="text-lg text-blue-200">Beluga League Team</p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-1 flex">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                activeTab === 'schedule' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'text-blue-200 hover:text-white'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                activeTab === 'roster' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'text-blue-200 hover:text-white'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                activeTab === 'stats' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'text-blue-200 hover:text-white'
              }`}
            >
              Stats
            </button>
          </div>
        </div>
        
        {/* Content Sections */}
        <div className="min-h-[500px]">
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 mb-10">
              <h2 className="text-2xl font-bold text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  {decodedTeamName}'s Schedule
                </span>
              </h2>
              
              {/* Division Tabs */}
              {teamDivisions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {teamDivisions.map((division) => (
                    <button 
                      key={division}
                      className={`relative px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform 
                        ${activeScheduleTab === division 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-105 shadow-xl' 
                          : 'bg-black/30 hover:bg-black/50 border border-white/10'
                        } overflow-hidden group`}
                      onClick={() => setActiveScheduleTab(division)}
                    >
                      <span className={`relative z-10 ${activeScheduleTab === division ? 'text-white' : 'group-hover:text-blue-200 transition-colors'}`}>
                        {getDivisionDisplayName(division)}
                      </span>
                      {activeScheduleTab === division && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-sm"></div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    </button>
                  ))}
                </div>
              )}
              
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                </div>
              ) : teamDivisions.length > 0 ? (
                <div className="space-y-6">
                  {teamSchedules[activeScheduleTab] && Object.entries(teamSchedules[activeScheduleTab] || {}).map(([week, matches]) => (
                    <div key={week} className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                        <h3 className="text-xl font-bold flex items-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 text-white">
                            {week.split(' ')[1]}
                          </span>
                          {week}
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid gap-4">
                          {matches.map((match, index) => (
                            <div 
                              key={`${week}-match-${index}`}
                              className="match-card bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm p-5 rounded-xl border border-white/10 hover:border-blue-400 transition-all transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_5px_30px_rgba(59,130,246,0.5)] duration-300 relative group overflow-hidden"
                            >
                              <div className="flex items-center justify-between relative">
                                {/* Team 1 */}
                                <div className={`flex flex-col items-center w-5/12 transition-transform duration-300 ${match[0] === decodedTeamName ? 'scale-110' : ''}`}>
                                  <div className="h-16 w-16 relative mb-3 flex items-center justify-center">
                                    <div className={`absolute inset-0 rounded-full ${match[0] === decodedTeamName ? 'bg-blue-500/30 animate-pulse' : 'bg-gradient-to-br from-blue-600/10 to-blue-400/10'}`}></div>
                                    <Link href={`/teams/${encodeURIComponent(match[0])}`}>
                                      <img 
                                        src={`/logos/${match[0]}.png`} 
                                        alt={match[0]} 
                                        className="h-14 w-14 object-contain relative z-10 transition-transform hover:scale-110 duration-300"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.style.display = 'none';
                                          if (e.currentTarget.parentElement) {
                                            e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-600/20', 'via-purple-600/20', 'to-blue-900/20', 'flex', 'items-center', 'justify-center');
                                            e.currentTarget.parentElement.innerHTML = `<span class="text-xl font-bold text-white opacity-80">${getTeamInitials(match[0])}</span>`;
                                          }
                                        }}
                                      />
                                    </Link>
                                  </div>
                                  <p className={`text-center font-medium text-sm w-full ${match[0] === decodedTeamName ? 'text-white font-bold' : 'text-blue-200'}`}>
                                    {match[0]}
                                  </p>
                                </div>

                                {/* VS */}
                                <div className="flex-shrink-0 w-2/12 flex flex-col items-center justify-center">
                                  <div className="my-1 p-2 rounded-full bg-black/40">
                                    <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">VS</span>
                                  </div>
                                </div>

                                {/* Team 2 */}
                                <div className={`flex flex-col items-center w-5/12 transition-transform duration-300 ${match[1] === decodedTeamName ? 'scale-110' : ''}`}>
                                  <div className="h-16 w-16 relative mb-3 flex items-center justify-center">
                                    <div className={`absolute inset-0 rounded-full ${match[1] === decodedTeamName ? 'bg-blue-500/30 animate-pulse' : 'bg-gradient-to-br from-purple-400/10 to-purple-600/10'}`}></div>
                                    <Link href={`/teams/${encodeURIComponent(match[1])}`}>
                                      <img 
                                        src={`/logos/${match[1]}.png`} 
                                        alt={match[1]} 
                                        className="h-14 w-14 object-contain relative z-10 transition-transform hover:scale-110 duration-300"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.style.display = 'none';
                                          if (e.currentTarget.parentElement) {
                                            e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-600/20', 'via-purple-600/20', 'to-blue-900/20');
                                            e.currentTarget.parentElement.innerHTML = `<span class="text-xl font-bold text-white opacity-80">${getTeamInitials(match[1])}</span>`;
                                          }
                                        }}
                                      />
                                    </Link>
                                  </div>
                                  <p className={`text-center font-medium text-sm w-full ${match[1] === decodedTeamName ? 'text-white font-bold' : 'text-blue-200'}`}>
                                    {match[1]}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-10 text-center">
                  <p className="text-xl text-blue-200">No matches found for {decodedTeamName}.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Roster Tab - Under Development */}
          {activeTab === 'roster' && (
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl max-w-4xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse-slow"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 transform scale-110 blur-md"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200 text-center">
                {decodedTeamName} Roster Coming Soon
              </h2>
              
              <p className="text-xl mb-8 text-blue-100 text-center">
                The complete roster with player statistics is currently being developed.
              </p>
              
              {/* Roster Preview */}
              <div className="mb-8">
                <div className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10 mb-6">
                  <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Player Roster Preview
                  </h3>
                  
                  <div className="overflow-hidden">
                    <div className="bg-black/40 rounded-lg overflow-hidden border border-white/10">
                      <div className="grid grid-cols-12 bg-blue-900/30 text-blue-200 font-semibold text-sm py-2 px-4">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-3">Position</div>
                        <div className="col-span-2">SAL</div>
                        <div className="col-span-2">Status</div>
                      </div>
                      
                      {/* Sample players with correct SAL ranges */}
                      {[
                        {
                          number: "07",
                          name: "Player One",
                          position: "Forward",
                          sal: 18.75,
                          status: "Active"
                        },
                        {
                          number: "12",
                          name: "Player Two",
                          position: "Defense",
                          sal: 16.25,
                          status: "Active"
                        },
                        {
                          number: "23",
                          name: "Player Three",
                          position: "Defense",
                          sal: 19.50,
                          status: "Active"
                        },
                        {
                          number: "09",
                          name: "Player Four",
                          position: "Forward",
                          sal: 17.75,
                          status: "Injured"
                        }
                      ].map((player, i) => (
                        <div 
                          key={i} 
                          className={`grid grid-cols-12 ${i % 2 === 0 ? 'bg-black/20' : 'bg-black/40'} text-sm py-3 px-4 hover:bg-blue-900/20 transition-colors duration-300`}
                        >
                          <div className="col-span-1 font-mono text-blue-300">{player.number}</div>
                          <div className="col-span-4 font-medium text-white">{player.name}</div>
                          <div className="col-span-3 text-blue-200">{player.position}</div>
                          <div className="col-span-2">
                            <span className="font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">{player.sal.toFixed(2)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              player.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {player.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Shimmer loading effect for remaining players */}
                    <div className="mt-1 space-y-1 rounded-b-lg overflow-hidden">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="h-10 bg-black/20 animate-pulse rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Player Performance Tracking
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Comprehensive statistics for each player including goals, assists, saves, and other key performance indicators tracked throughout the season.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      Dynamic SAL Ratings
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Skill Assessment Levels (SAL) for each player, updated based on match performance. Track player growth and development throughout the season.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Player Status Updates
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Real-time updates on player availability including active, inactive, and injury statuses to keep you informed about your team's composition.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Team Chemistry Analysis
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Insights into how well players perform together, highlighting the most effective combinations and lineups based on past match data.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg text-blue-200 mb-6">
                  Please check back soon for complete player information and statistics!
                </p>
              </div>
            </div>
          )}
          
          {/* Stats Tab - Under Development */}
          {activeTab === 'stats' && (
            <div className="bg-black/40 backdrop-blur-md p-12 rounded-2xl border border-white/10 shadow-xl max-w-3xl mx-auto text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                <div className="absolute inset-4 rounded-full bg-blue-500/40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
                Team Stats Coming Soon
              </h2>
              
              <p className="text-xl mb-8 text-blue-100">
                The {decodedTeamName} statistics dashboard is currently being developed.
              </p>
              
              <p className="text-lg text-blue-200 mb-6">
                Please check back soon for detailed team performance stats!
              </p>
            </div>
          )}
        </div>
        
        {/* Return to Home Button */}
        <div className="flex justify-center mt-16">
          <Link 
            href="/" 
            className="relative group px-8 py-4 bg-gradient-to-r from-black/20 to-black/40 backdrop-blur-sm rounded-full font-medium text-white border border-white/20 hover:border-blue-400 transition-all transform hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Return to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black/90 via-black/80 to-black/90 text-white py-8 mt-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex items-center justify-center mr-2">
                <img 
                  src="/logos/league_logo.png" 
                  alt="Beluga League" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement.innerHTML = '<span class="font-bold text-sm text-blue-300">BL</span>';
                    }
                  }}
                />
              </div>
              <span className="text-sm text-blue-200 font-medium">Beluga League</span>
            </div>
            <div className="text-center text-sm text-gray-400">
              © {new Date().getFullYear()} Beluga League. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}