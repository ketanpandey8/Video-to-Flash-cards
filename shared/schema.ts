import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  status: text("status").notNull().default("uploading"), // uploading, processing, completed, failed
  transcription: text("transcription"),
  processingProgress: integer("processing_progress").default(0),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull(),
});

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  currentCardIndex: integer("current_card_index").default(0),
  completedCards: json("completed_cards").$type<number[]>().default([]),
  reviewCards: json("review_cards").$type<number[]>().default([]),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  studyTime: integer("study_time").default(0), // in seconds
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  uploadedAt: true,
  status: true,
  transcription: true,
  processingProgress: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  startedAt: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;
