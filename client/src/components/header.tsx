export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fas fa-play text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">VideoFlash</h1>
              <p className="text-sm text-slate-600">AI-Powered Learning</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-700 hover:text-primary font-medium">Dashboard</a>
            <a href="#" className="text-slate-700 hover:text-primary font-medium">Library</a>
            <a href="#" className="text-slate-700 hover:text-primary font-medium">Progress</a>
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <i className="fas fa-user mr-2"></i>Account
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
