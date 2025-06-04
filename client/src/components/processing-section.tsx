import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "./ui/progress";
import VideoPlayer from "./video-player";

interface ProcessingSectionProps {
  videoId: number;
  onComplete: () => void;
}

export default function ProcessingSection({ videoId, onComplete }: ProcessingSectionProps) {
  const { data: videoData } = useQuery({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}`);
      if (!response.ok) throw new Error("Failed to fetch video status");
      return response.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const video = videoData?.video;
  const progress = video?.processingProgress || 0;
  const status = video?.status || "processing";

  useEffect(() => {
    if (status === "completed") {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [status, onComplete]);

  // Show error state
  if (status === "failed") {
    const errorMessage = (video as any)?.errorMessage || "An unknown error occurred during processing";
    
    return (
      <div className="mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Processing Failed</h3>
            <p className="text-slate-600 mb-4">We encountered an error while processing your video:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{errorMessage}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getProcessingSteps = () => {
    const steps = [
      { label: "Video uploaded successfully", completed: progress >= 10 },
      { label: "Extracting audio and analyzing content", completed: progress >= 60 },
      { label: "Generating Q&A flashcards", completed: progress >= 80 },
      { label: "Finalizing your study set", completed: progress >= 100 },
    ];

    return steps;
  };

  const steps = getProcessingSteps();

  return (
    <div className="mb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-cog fa-spin text-2xl text-accent"></i>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Processing Your Video</h3>
          <p className="text-slate-600">AI is analyzing the content and generating flashcards...</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Processing Progress</span>
            <span className="text-sm text-slate-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              {step.completed ? (
                <i className="fas fa-check-circle text-secondary text-lg"></i>
              ) : index === steps.findIndex(s => !s.completed) ? (
                <i className="fas fa-spinner fa-spin text-accent text-lg"></i>
              ) : (
                <i className="fas fa-circle text-slate-300 text-lg"></i>
              )}
              <span className={step.completed ? "text-slate-700" : "text-slate-400"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}