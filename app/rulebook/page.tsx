"use client"
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function RulebookPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tableOfContents, setTableOfContents] = useState<{id: string, text: string, level: number}[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const publishedDocUrl = "https://docs.google.com/document/d/e/2PACX-1vTBi5BDycuXzBnOgE3oCZxxw9cHmkgcXdDqo3Norz-7HslR7JzYh3GTCMASTMT4zz_OukqF1Qo78OPb/pub";
  
  useEffect(() => {
    async function fetchGoogleDoc() {
      try {
        setLoading(true);
        // Fetch the published Google Doc HTML
        const response = await fetch(publishedDocUrl);
        const html = await response.text();
        
        // Extract content using DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get the main content
        const contentDiv = doc.querySelector('.doc-content');
        let extractedContent = '';
        
        if (contentDiv) {
          // Clean up the HTML and extract just what we need
          extractedContent = contentDiv.innerHTML;
        } else {
          // Fallback: try to get the content from the body
          const bodyContent = doc.body.innerHTML;
          // Extract content between main divs
          const contentMatch = bodyContent.match(/<div[^>]*id=['"]contents['"][^>]*>([\s\S]*?)<\/div>/i);
          if (contentMatch && contentMatch[1]) {
            extractedContent = contentMatch[1];
          }
        }
        
        // Sanitize the HTML
        const cleanHTML = DOMPurify.sanitize(extractedContent);
        setContent(cleanHTML);
      } catch (error) {
        console.error('Error fetching Google Doc:', error);
        setContent('<p>Error loading rulebook. Please try again later.</p>');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGoogleDoc();
  }, [publishedDocUrl]);

  // Extract headings and build table of contents after content is loaded
  useEffect(() => {
    if (!content || !contentRef.current) return;
    
    const headingElements = contentRef.current.querySelectorAll('h1, h2, h3');
    const toc: {id: string, text: string, level: number}[] = [];
    
    headingElements.forEach((heading, index) => {
      const id = `section-${index}`;
      heading.id = id;
      
      const level = parseInt(heading.tagName.substring(1));
      toc.push({
        id,
        text: heading.textContent || `Section ${index + 1}`,
        level
      });
      
      // Add fancy decorative element to headings
      const decorElement = document.createElement('span');
      decorElement.className = 'heading-decorator';
      heading.appendChild(decorElement);
    });
    
    setTableOfContents(toc);
    
    // Set up intersection observer to track active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -90% 0px' }
    );
    
    headingElements.forEach((heading) => {
      observer.observe(heading);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [content]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
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
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-10 text-center relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
            Beluga League Rulebook
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-blue-500 opacity-10 blur-sm whitespace-nowrap">
            Beluga League Rulebook
          </span>
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar navigation */}
            {tableOfContents.length > 0 && (
              <div className="md:w-64 lg:w-80 shrink-0">
                <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-5 sticky top-24 max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-thin">
                  <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 text-center">
                    Contents
                  </h3>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mb-4"></div>
                  <nav className="space-y-1.5">
                    {tableOfContents.map((item) => (
                      <button 
                        key={item.id} 
                        className={`
                          group w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-200 relative
                          ${item.level === 1 ? 'font-bold' : item.level === 2 ? 'pl-6 font-medium' : 'pl-8'} 
                          ${activeSection === item.id 
                            ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-white shadow-sm' 
                            : 'hover:bg-blue-500/10 text-blue-200 hover:text-white'}
                        `}
                        onClick={() => {
                          const element = document.getElementById(item.id);
                          if (element) {
                            // Improved scroll behavior
                            const headerOffset = 120; // Increased to account for sticky header
                            
                            // Using setTimeout to ensure DOM is ready
                            setTimeout(() => {
                              const elementPosition = element.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.scrollY - headerOffset;
                              
                              window.scrollTo({
                                top: offsetPosition,
                                behavior: "smooth"
                              });
                              
                              // Set active section immediately for better UX
                              setActiveSection(item.id);
                              
                              // Add a flash effect to the target heading
                              element.classList.add('flash-highlight');
                              setTimeout(() => {
                                element.classList.remove('flash-highlight');
                              }, 1000);
                            }, 50);
                          }
                        }}
                        aria-current={activeSection === item.id ? 'true' : 'false'}
                      >
                        {/* Visual indicators for hierarchy */}
                        {item.level === 2 && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        )}
                        {item.level === 3 && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-300/70"></span>
                        )}
                        {/* Text content */}
                        {item.text}
                        {/* Right arrow indicator that appears on hover or when active */}
                        <span className={`
                          absolute right-2 top-1/2 -translate-y-1/2 transform transition-all duration-200
                          ${activeSection === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}
                        `}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className="flex-1">
              <div className="bg-black/30 backdrop-blur-md p-8 md:p-12 rounded-2xl border border-white/10 shadow-xl mb-10">
                {/* Custom styled content */}
                <div 
                  ref={contentRef}
                  className="rulebook-content text-blue-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                
                {!content && (
                  <div className="text-center text-blue-200 py-10">
                    <p className="text-xl mb-4">Unable to extract rulebook content.</p>
                    <p>Please view the rulebook directly:</p>
                    <a 
                      href={publishedDocUrl}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="inline-block mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Open Rulebook
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Return to Home Button */}
        <div className="flex justify-center mt-10">
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

      <style jsx global>{`
        /* Enhanced heading styles */
        .rulebook-content h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          position: relative;
          color: white;
          background-image: linear-gradient(to right, #60a5fa, #c084fc, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
          border-bottom: 1px solid rgba(147, 197, 253, 0.2);
        }

        .rulebook-content h1::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100px;
          height: 3px;
          background: linear-gradient(to right, #60a5fa, #c084fc);
          border-radius: 4px;
        }
        
        .rulebook-content h2 {
          font-size: 1.9rem;
          font-weight: bold;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.25rem;
          color: #a5b4fc;
          border-bottom: 1px dashed rgba(165, 180, 252, 0.3);
          position: relative;
        }

        .rulebook-content h2::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -1rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #60a5fa;
          border-radius: 50%;
          transform: translateY(-50%);
        }
        
        .rulebook-content h3 {
          font-size: 1.6rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #93c5fd;
          position: relative;
          padding-left: 0.75rem;
        }

        .rulebook-content h3::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.25rem;
          bottom: 0.25rem;
          width: 3px;
          background: linear-gradient(to bottom, #60a5fa, transparent);
          border-radius: 4px;
        }
        
        .rulebook-content p {
          margin-bottom: 1.25rem;
          line-height: 1.7;
        }
        
        .rulebook-content ul, .rulebook-content ol {
          margin-left: 1.75rem;
          margin-bottom: 1.25rem;
          margin-top: 0.75rem;
        }
        
        .rulebook-content li {
          margin-bottom: 0.75rem;
          position: relative;
        }
        
        .rulebook-content ul > li::marker {
          color: #60a5fa;
        }
        
        .rulebook-content ol {
          counter-reset: item;
          list-style-type: none;
        }
        
        .rulebook-content ol > li {
          counter-increment: item;
          position: relative;
          padding-left: 0.5rem;
        }
        
        .rulebook-content ol > li::before {
          content: counter(item) ".";
          position: absolute;
          left: -1.5rem;
          color: #60a5fa;
          font-weight: bold;
        }
        
        .rulebook-content strong, .rulebook-content b {
          color: white;
          font-weight: bold;
        }
        
        .rulebook-content a {
          color: #93c5fd;
          text-decoration: none;
          border-bottom: 1px dashed rgba(147, 197, 253, 0.5);
          padding-bottom: 1px;
          transition: all 0.2s;
        }
        
        .rulebook-content a:hover {
          color: #dbeafe;
          border-bottom-color: #dbeafe;
        }
        
        .rulebook-content hr {
          border: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(219, 234, 254, 0.3), transparent);
          margin: 2.5rem 0;
        }
        
        .rulebook-content table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(96, 165, 250, 0.2);
        }
        
        .rulebook-content th {
          background: linear-gradient(to bottom, rgba(30, 64, 175, 0.4), rgba(30, 58, 138, 0.4));
          color: white;
          font-weight: bold;
          text-align: left;
          padding: 1rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .rulebook-content td {
          padding: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }
        
        .rulebook-content tr:nth-child(even) td {
          background: rgba(30, 58, 138, 0.1);
        }
        
        .rulebook-content tr:last-child td {
          border-bottom: none;
        }
        
        .rulebook-content blockquote {
          border-left: 4px solid #3b82f6;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #93c5fd;
        }

        .rulebook-content blockquote p:last-child {
          margin-bottom: 0;
        }
        
        /* Scrollbar styling */
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.6);
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.8);
        }
        
        /* Flash highlight effect for clicked headings */
        @keyframes flash-highlight {
          0% { background-color: rgba(96, 165, 250, 0); }
          50% { background-color: rgba(96, 165, 250, 0.2); }
          100% { background-color: rgba(96, 165, 250, 0); }
        }

        .flash-highlight {
          animation: flash-highlight 1s ease-out;
          border-radius: 4px;
        }

        /* Improve the clickable feel of sidebar buttons */
        button {
          cursor: pointer;
          transition: all 0.2s;
        }

        button:active {
          transform: translateY(1px);
        }

        /* Make sidebar more visually engaging */
        .scrollbar-thin nav button {
          position: relative;
          overflow: hidden;
        }

        .scrollbar-thin nav button::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          height: 1px;
          width: 0;
          background: linear-gradient(to right, transparent, rgba(96, 165, 250, 0.5), transparent);
          transition: width 0.3s ease;
        }

        .scrollbar-thin nav button:hover::after {
          width: 100%;
        }
      `}</style>
    </div>
  );
}