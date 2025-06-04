import { videos, flashcards, studySessions, type Video, type InsertVideo, type Flashcard, type InsertFlashcard, type StudySession, type InsertStudySession } from "@shared/schema";

export interface IStorage {
  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  updateVideoStatus(id: number, status: string, progress?: number): Promise<void>;
  updateVideoTranscription(id: number, transcription: string): Promise<void>;
  
  // Flashcard operations
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getFlashcardsByVideoId(videoId: number): Promise<Flashcard[]>;
  
  // Study session operations
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  getStudySession(id: number): Promise<StudySession | undefined>;
  getStudySessionByVideoId(videoId: number): Promise<StudySession | undefined>;
  updateStudySession(id: number, updates: Partial<StudySession>): Promise<void>;
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video>;
  private flashcards: Map<number, Flashcard>;
  private studySessions: Map<number, StudySession>;
  private currentVideoId: number;
  private currentFlashcardId: number;
  private currentStudySessionId: number;

  constructor() {
    this.videos = new Map();
    this.flashcards = new Map();
    this.studySessions = new Map();
    this.currentVideoId = 1;
    this.currentFlashcardId = 1;
    this.currentStudySessionId = 1;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.currentVideoId++;
    const video: Video = {
      ...insertVideo,
      id,
      uploadedAt: new Date().toISOString(),
      status: "uploading",
      transcription: null,
      processingProgress: 0,
    };
    this.videos.set(id, video);
    return video;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async updateVideoStatus(id: number, status: string, progress?: number): Promise<void> {
    const video = this.videos.get(id);
    if (video) {
      video.status = status;
      if (progress !== undefined) {
        video.processingProgress = progress;
      }
      this.videos.set(id, video);
    }
  }

  async updateVideoTranscription(id: number, transcription: string): Promise<void> {
    const video = this.videos.get(id);
    if (video) {
      video.transcription = transcription;
      this.videos.set(id, video);
    }
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    const flashcard: Flashcard = { ...insertFlashcard, id };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async getFlashcardsByVideoId(videoId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values())
      .filter(card => card.videoId === videoId)
      .sort((a, b) => a.order - b.order);
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = this.currentStudySessionId++;
    const session: StudySession = {
      ...insertSession,
      id,
      startedAt: new Date().toISOString(),
      currentCardIndex: 0,
      completedCards: [],
      reviewCards: [],
      studyTime: 0,
      completedAt: null,
    };
    this.studySessions.set(id, session);
    return session;
  }

  async getStudySession(id: number): Promise<StudySession | undefined> {
    return this.studySessions.get(id);
  }

  async getStudySessionByVideoId(videoId: number): Promise<StudySession | undefined> {
    return Array.from(this.studySessions.values())
      .find(session => session.videoId === videoId);
  }

  async updateStudySession(id: number, updates: Partial<StudySession>): Promise<void> {
    const session = this.studySessions.get(id);
    if (session) {
      Object.assign(session, updates);
      this.studySessions.set(id, session);
    }
  }
}

export const storage = new MemStorage();
