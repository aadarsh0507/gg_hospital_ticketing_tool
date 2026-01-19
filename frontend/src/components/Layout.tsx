import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, activePage, onPageChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-100 overflow-x-hidden w-full max-w-full" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
      <Sidebar 
        activePage={activePage} 
        onPageChange={onPageChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'none' }}
        />
      )}
      <div className="lg:ml-64 w-full lg:w-[calc(100%-16rem)] min-w-0 max-w-full lg:max-w-[calc(100%-16rem)] overflow-x-hidden" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-2 sm:p-4 lg:p-6 w-full min-w-0 max-w-full overflow-x-hidden pb-20 box-border" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
          <div className="w-full min-w-0 max-w-full overflow-x-hidden box-border">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
