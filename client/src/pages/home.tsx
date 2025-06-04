import { useState } from "react";
import Header from "@/components/header";
import LoginGate from "@/components/login-gate";
import UploadSection from "@/components/upload-section";
import ProcessingSection from "@/components/processing-section";
import StudyInterface from "@/components/study-interface";
import CompletionSection from "@/components/completion-section";

type AppState = "upload" | "processing" | "study" | "completion";

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>("upload");
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);

  const handleVideoUploaded = (videoId: number) => {
    setCurrentVideoId(videoId);
    setCurrentState("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentState("study");
  };

  const handleStudyComplete = () => {
    setCurrentState("completion");
  };

  const handleStartOver = () => {
    setCurrentVideoId(null);
    setCurrentState("upload");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <LoginGate>
        <main className="max-w-4xl mx-auto p-8">
          {currentState === "upload" && (
            <UploadSection onVideoUploaded={handleVideoUploaded} />
          )}

          {currentState === "processing" && currentVideoId && (
            <ProcessingSection 
              videoId={currentVideoId} 
              onComplete={handleProcessingComplete}
            />
          )}

          {currentState === "study" && currentVideoId && (
            <StudyInterface 
              videoId={currentVideoId}
              onComplete={handleStudyComplete}
            />
          )}

          {currentState === "completion" && (
            <CompletionSection onStartOver={handleStartOver} />
          )}
        </main>
      </LoginGate>
    </div>
  );
}