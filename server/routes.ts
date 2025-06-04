
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

    // Extract audio from video using FFmpeg
    const audioPath = `uploads/audio_${videoId}.wav`;
    const ffmpegCommand = `ffmpeg -i "${filePath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;
    
    try {
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error('FFmpeg error:', error);
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      // Transcribe audio using OpenAI Whisper
      const fs = require('fs');
      const audioFile = fs.createReadStream(audioPath);
      
      const openai = new (require('openai').default)({
        apiKey: process.env.OPEN_API_VIDTUT || "default_key"
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en"
      });

      await storage.updateVideoTranscription(videoId, transcription.text);

      // Clean up audio file
      fs.unlink(audioPath, (err: any) => {
        if (err) console.error('Failed to delete audio file:', err);
      });

    } catch (error) {
      console.error('Audio processing error:', error);
      // Fallback to placeholder if processing fails
      const fallbackTranscription = `Audio processing failed for this video. This could be due to: 1) FFmpeg not being installed, 2) Invalid audio format, 3) OpenAI API issues. Please check your setup and try again.`;
      await storage.updateVideoTranscription(videoId, fallbackTranscription);
    }
    await storage.updateVideoStatus(videoId, "processing", 60);

    // Generate flashcards using OpenAI with actual transcription
    await new Promise(resolve => setTimeout(resolve, 1000));
    const video = await storage.getVideo(videoId);
    if (!video?.transcription) {
      throw new Error("No transcription available for flashcard generation");
    }

    const flashcards = await generateFlashcards(video.transcription);
    if (flashcards.length === 0) {
      throw new Error("Failed to generate flashcards from video content");
    }

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

    // Process video from URL
    try {
      let transcriptionText = '';

      // Handle YouTube URLs with yt-dlp
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const { exec } = require('child_process');
        const tempVideoPath = `uploads/temp_video_${videoId}.mp4`;
        const audioPath = `uploads/audio_${videoId}.wav`;

        // Download video using yt-dlp
        const downloadCommand = `yt-dlp -f "best[height<=720]" -o "${tempVideoPath}" "${videoUrl}"`;
        await new Promise((resolve, reject) => {
          exec(downloadCommand, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error('yt-dlp error:', error);
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });

        // Extract audio
        const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;
        await new Promise((resolve, reject) => {
          exec(ffmpegCommand, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error('FFmpeg error:', error);
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });

        // Transcribe with Whisper
        const fs = require('fs');
        const audioFile = fs.createReadStream(audioPath);
        
        const openai = new (require('openai').default)({
          apiKey: process.env.OPEN_API_VIDTUT || "default_key"
        });

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en"
        });

        transcriptionText = transcription.text;

        // Clean up temporary files
        fs.unlink(tempVideoPath, (err: any) => {
          if (err) console.error('Failed to delete temp video:', err);
        });
        fs.unlink(audioPath, (err: any) => {
          if (err) console.error('Failed to delete audio file:', err);
        });

      } else {
        // For other video URLs, attempt direct processing
        transcriptionText = `Video URL processing for ${videoUrl} requires additional setup. Currently, only YouTube URLs are supported with yt-dlp. For other video sources, please upload the video file directly.`;
      }

      await storage.updateVideoTranscription(videoId, transcriptionText);

    } catch (error) {
      console.error('Video URL processing error:', error);
      const fallbackTranscription = `Failed to process video from ${videoUrl}. This could be due to: 1) Missing yt-dlp or FFmpeg, 2) Video not accessible, 3) Network issues, 4) OpenAI API problems. Please try uploading the video file directly instead.`;
      await storage.updateVideoTranscription(videoId, fallbackTranscription);
    }
    await storage.updateVideoStatus(videoId, "processing", 60);

    // Generate flashcards using OpenAI with actual transcription
    await new Promise(resolve => setTimeout(resolve, 1000));
    const video = await storage.getVideo(videoId);
    if (!video?.transcription) {
      throw new Error("No transcription available for flashcard generation");
    }

    const flashcards = await generateFlashcards(video.transcription);
    if (flashcards.length === 0) {
      throw new Error("Failed to generate flashcards from video content");
    }

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
