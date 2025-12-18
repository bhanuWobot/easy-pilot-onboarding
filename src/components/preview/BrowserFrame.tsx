import { ReactNode } from 'react';

interface BrowserFrameProps {
  children: ReactNode;
}

export function BrowserFrame({ children }: BrowserFrameProps) {
  return (
    <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
      {/* Browser Chrome */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center gap-2">
        {/* Traffic lights */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        
        {/* Address bar */}
        <div className="flex-1 ml-4">
          <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 border border-gray-300">
            <span className="text-gray-400">🔒</span> localhost:5173/welcome
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="w-full h-[calc(100%-52px)] overflow-auto bg-white">
        {children}
      </div>
    </div>
  );
}
