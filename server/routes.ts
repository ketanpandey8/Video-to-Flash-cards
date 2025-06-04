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

  // Upload video from URL endpoint
  app.post("/api/videos/upload-url", async (req, res) => {
    try {
      const { videoUrl } = req.body;

      if (!videoUrl) {
        return res.status(400).json({ message: "No video URL provided" });
      }

      // Validate URL
      try {
        new URL(videoUrl);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Extract filename from URL
      const urlObj = new URL(videoUrl);
      const pathname = urlObj.pathname;
      const originalName = pathname.split('/').pop() || 'video.mp4';
      const filename = `url_${Date.now()}_${originalName}`;

      const videoData = {
        filename,
        originalName,
        fileSize: 0, // We don't know the size yet
        mimeType: 'video/mp4', // Default to mp4
        videoUrl, // Store the original URL
      };

      const validatedData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(validatedData);

      // Start processing URL video in background
      processVideoFromUrl(video.id, videoUrl).catch(console.error);

      res.json({ video });
    } catch (error) {
      console.error('URL upload error:', error);
      res.status(500).json({ message: "Failed to process video URL" });
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

    // TODO: Implement real video processing
    // 1. Extract audio from video using FFmpeg: ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 2 audio.wav
    // 2. Use OpenAI Whisper API for transcription: openai.audio.transcriptions.create()
    // For now, using a placeholder that indicates the limitation
    const placeholderTranscription = `This video content has not been processed yet. To generate accurate flashcards that match your video content, you need to implement: 1) Audio extraction from the uploaded video file using FFmpeg, 2) Speech-to-text transcription using OpenAI Whisper API or similar service, 3) Content analysis to extract key educational points. Currently showing generic educational content as an example.`;
    
    await storage.updateVideoTranscription(videoId, placeholderTranscription);
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

// Background video processing function for URL uploads
async function processVideoFromUrl(videoId: number, videoUrl: string) {
  try {
    // Update status to processing
    await storage.updateVideoStatus(videoId, "processing", 10);

    // Simulate downloading and processing video from URL
    await new Promise(resolve => setTimeout(resolve, 1500));
    await storage.updateVideoStatus(videoId, "processing", 30);

    // TODO: Implement real video URL processing
    // For YouTube URLs: Use youtube-transcript-api or YouTube Data API
    // For other URLs: Download video, extract audio, and transcribe
    // For now, indicating this is placeholder content
    const placeholderTranscription = `This video content from ${videoUrl} has not been processed yet. To generate accurate flashcards that match your specific video content, you need to implement: 1) Video download or streaming, 2) Audio extraction, 3) Speech-to-text transcription, 4) Content analysis. Currently showing generic educational content as placeholder.`;
    
    await storage.updateVideoTranscription(videoId, placeholderTranscription);
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

  } catch (error) {
    console.error('Video URL processing error:', error);
    await storage.updateVideoStatus(videoId, "failed", 0);
  }
}
