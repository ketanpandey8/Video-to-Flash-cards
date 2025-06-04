
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Shield } from "lucide-react";

interface LoginGateProps {
  children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const { user, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Please log in with your Replit account to access VideoFlash and start creating flashcards from your videos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={login} 
              className="w-full bg-primary hover:bg-blue-700"
              size="lg"
            >
              <i className="fas fa-user mr-2"></i>
              Login with Replit
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Your videos and study sessions will be saved to your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
