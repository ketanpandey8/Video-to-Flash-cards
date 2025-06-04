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

// Background video processing function for URL uploads
async function processVideoFromUrl(videoId: number, videoUrl: string) {
  try {
    // Update status to processing
    await storage.updateVideoStatus(videoId, "processing", 10);

    // Simulate downloading and processing video from URL
    await new Promise(resolve => setTimeout(resolve, 1500));
    await storage.updateVideoStatus(videoId, "processing", 30);

    // Generate transcription based on video URL content
    let mockTranscription = '';
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      mockTranscription = `This is a YouTube educational video covering important concepts in web development and programming. The video discusses modern JavaScript frameworks like React, Vue, and Angular, explaining their core differences and use cases. Key topics include component-based architecture, state management, virtual DOM concepts, and the importance of choosing the right framework for your project. The presenter explains how React uses JSX syntax and hooks for state management, while Vue provides a more template-based approach with its reactive data system. Angular is presented as a full-featured framework with TypeScript integration and dependency injection. The video also covers best practices for component design, performance optimization techniques, and testing strategies for modern web applications.`;
    } else if (videoUrl.includes('vimeo.com')) {
      mockTranscription = `This Vimeo educational content focuses on advanced design principles and user experience fundamentals. The video covers color theory, typography selection, and layout composition for modern web interfaces. Key concepts include visual hierarchy, white space utilization, and accessibility considerations in design. The presenter demonstrates how to create cohesive design systems, implement responsive design patterns, and ensure cross-browser compatibility. Important topics include user research methodologies, wireframing techniques, and prototyping tools. The video also addresses performance implications of design decisions, image optimization strategies, and the importance of mobile-first design approaches in today's digital landscape.`;
    } else if (videoUrl.includes('bigbuckbunny') || videoUrl.includes('sample') || videoUrl.includes('demo')) {
      mockTranscription = `This is a demonstration video showcasing video processing capabilities and educational content generation. The video explains how modern AI systems can automatically extract meaningful information from video content to create learning materials. Key topics include speech recognition technology, natural language processing for content analysis, and automated question generation algorithms. The demonstration covers the technical pipeline from video input to flashcard output, including audio extraction, transcription accuracy considerations, and content summarization techniques. The video also discusses applications in educational technology, personalized learning systems, and adaptive assessment tools.`;
    } else {
      mockTranscription = `This educational video content covers fundamental concepts in computer science and software engineering. The video discusses algorithm design, data structures, and problem-solving methodologies essential for programming. Key topics include time complexity analysis, space optimization, and choosing appropriate data structures for different use cases. The presenter explains sorting algorithms, searching techniques, and graph traversal methods with practical examples. The video also covers software design patterns, code organization principles, and debugging strategies. Important concepts include object-oriented programming, functional programming paradigms, and best practices for writing maintainable, scalable code.`;
    }
    
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

  } catch (error) {
    console.error('Video URL processing error:', error);
    await storage.updateVideoStatus(videoId, "failed", 0);
  }
}
