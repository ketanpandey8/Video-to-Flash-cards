import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function Header() {
  const { user, isLoading, login, logout } = useAuth();

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
          <nav className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">Welcome, {user.name}!</span>
                <Avatar>
                  <AvatarImage src={user.profileImage} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={logout}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={login}
                className="bg-primary text-white hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-user mr-2"></i>
                Login with Replit
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
