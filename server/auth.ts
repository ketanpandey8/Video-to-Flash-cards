
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  url?: string;
  roles?: string[];
  teams?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function extractUserFromHeaders(req: Request): AuthenticatedUser | null {
  const userId = req.headers['x-replit-user-id'] as string;
  const userName = req.headers['x-replit-user-name'] as string;
  const profileImage = req.headers['x-replit-user-profile-image'] as string;
  const bio = req.headers['x-replit-user-bio'] as string;
  const url = req.headers['x-replit-user-url'] as string;
  const roles = req.headers['x-replit-user-roles'] as string;
  const teams = req.headers['x-replit-user-teams'] as string;

  if (!userId || !userName) {
    return null;
  }

  let parsedRoles: string[] = [];
  let parsedTeams: string[] = [];

  try {
    if (roles) {
      parsedRoles = JSON.parse(roles);
    }
  } catch (error) {
    console.warn('Failed to parse roles header:', roles);
    parsedRoles = [];
  }

  try {
    if (teams) {
      parsedTeams = JSON.parse(teams);
    }
  } catch (error) {
    console.warn('Failed to parse teams header:', teams);
    parsedTeams = [];
  }

  return {
    id: userId,
    name: userName,
    profileImage,
    bio,
    url,
    roles: parsedRoles,
    teams: parsedTeams
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = extractUserFromHeaders(req);
  req.user = user;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUserFromHeaders(req);
  
  if (!user) {
    return res.status(401).json({ 
      message: "Authentication required. Please log in with Replit." 
    });
  }
  
  req.user = user;
  next();
}
