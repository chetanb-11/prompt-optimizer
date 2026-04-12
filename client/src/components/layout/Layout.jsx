import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      {/* Main Content — offset by sidebar width, uses CSS to handle collapse */}
      <main className="ml-[68px] lg:ml-[240px] min-h-screen transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
