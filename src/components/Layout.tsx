import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, activePage, onPageChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activePage={activePage} onPageChange={onPageChange} />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
