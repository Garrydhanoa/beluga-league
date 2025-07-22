export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-black/90 via-black/80 to-black/90 text-white py-6 sm:py-8 mt-10 sm:mt-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 flex items-center justify-center mr-2">
              <img 
                src="/logos/league_logo.png" 
                alt="Beluga League" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                    e.currentTarget.parentElement.innerHTML = '<span class="font-bold text-xs sm:text-sm text-blue-300">BL</span>';
                  }
                }}
              />
            </div>
            <span className="text-xs sm:text-sm text-blue-200 font-medium">Beluga League</span>
          </div>
          <div className="text-center text-xs sm:text-sm text-gray-400">
            © {new Date().getFullYear()} Beluga League. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}