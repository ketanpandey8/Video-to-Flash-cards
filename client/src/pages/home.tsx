import { useState } from "react";
import Header from "@/components/header";
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        
        {currentState === "completion" && currentVideoId && (
          <CompletionSection 
            videoId={currentVideoId}
            onStartOver={handleStartOver}
          />
        )}
      </main>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={handleStartOver}
          className="bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center"
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>
    </div>
  );
}
