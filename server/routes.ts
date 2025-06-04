import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertVideoSchema, insertStudySessionSchema } from "@shared/schema";
import { generateFlashcards } from "./lib/openai";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MOV, and AVI files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload video endpoint
  app.post("/api/videos/upload", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const videoData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      const validatedData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(validatedData);

      // Start processing in background
      processVideo(video.id, req.file.path).catch(console.error);

      res.json({ video });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Get video by ID
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json({ video });
    } catch (error) {
      console.error('Get video error:', error);
      res.status(500).json({ message: "Failed to get video" });
    }
  });

  // Get flashcards for video
  app.get("/api/videos/:id/flashcards", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const flashcards = await storage.getFlashcardsByVideoId(videoId);
      res.json({ flashcards });
    } catch (error) {
      console.error('Get flashcards error:', error);
      res.status(500).json({ message: "Failed to get flashcards" });
    }
  });

  // Create study session
  app.post("/api/videos/:id/study-session", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      // Check if study session already exists
      let session = await storage.getStudySessionByVideoId(videoId);
      
      if (!session) {
        const sessionData = { videoId };
        const validatedData = insertStudySessionSchema.parse(sessionData);
        session = await storage.createStudySession(validatedData);
      }

      res.json({ session });
    } catch (error) {
      console.error('Create study session error:', error);
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  // Update study session
  app.patch("/api/study-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateStudySession(sessionId, updates);
      const session = await storage.getStudySession(sessionId);
      
      res.json({ session });
    } catch (error) {
      console.error('Update study session error:', error);
      res.status(500).json({ message: "Failed to update study session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background video processing function
async function processVideo(videoId: number, filePath: string) {
  try {
    // Update status to processing
    await storage.updateVideoStatus(videoId, "processing", 10);

    // Extract audio and transcribe (simplified - in real implementation would use FFmpeg)
    await new Promise(resolve => setTimeout(resolve, 1000));
    await storage.updateVideoStatus(videoId, "processing", 30);

    // Simulate transcription (in real implementation, would extract audio and use Whisper)
    const mockTranscription = `Welcome to this introduction to machine learning. Today we'll be covering the fundamental concepts that every data scientist should know. Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every possible scenario. There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled training data where the algorithm learns from input-output pairs to make predictions on new data. Common examples include classification and regression problems. Unsupervised learning works with unlabeled data to discover hidden patterns, structures, or relationships without predefined correct answers. Examples include clustering and dimensionality reduction. Reinforcement learning involves an agent learning to make decisions through trial and error by receiving rewards or penalties for its actions. This is commonly used in game playing and robotics applications.`;
    
    await storage.updateVideoTranscription(videoId, mockTranscription);
    await storage.updateVideoStatus(videoId, "processing", 60);

    // Generate flashcards using OpenAI
    await new Promise(resolve => setTimeout(resolve, 1000));
    const flashcards = await generateFlashcards(mockTranscription);
    await storage.updateVideoStatus(videoId, "processing", 80);

    // Save flashcards
    for (let i = 0; i < flashcards.length; i++) {
      await storage.createFlashcard({
        videoId,
        question: flashcards[i].question,
        answer: flashcards[i].answer,
        order: i,
      });
    }

    await storage.updateVideoStatus(videoId, "completed", 100);

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });

  } catch (error) {
    console.error('Video processing error:', error);
    await storage.updateVideoStatus(videoId, "failed", 0);
  }
}
