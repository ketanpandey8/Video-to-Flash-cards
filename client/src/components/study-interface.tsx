import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VideoPlayer from "./video-player";
import { motion } from "framer-motion";

interface StudyInterfaceProps {
  videoId: number;
  onComplete: () => void;
}

export default function StudyInterface({ videoId, onComplete }: StudyInterfaceProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const queryClient = useQueryClient();

  // Fetch video data
  const { data: videoData } = useQuery({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}`);
      if (!response.ok) throw new Error("Failed to fetch video");
      return response.json();
    },
  });

  // Fetch flashcards
  const { data: flashcardsData } = useQuery({
    queryKey: ["/api/videos", videoId, "flashcards"],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/flashcards`);
      if (!response.ok) throw new Error("Failed to fetch flashcards");
      return response.json();
    },
  });

  // Fetch or create study session
  const { data: sessionData } = useQuery({
    queryKey: ["/api/videos", videoId, "study-session"],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/study-session`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create study session");
      return response.json();
    },
  });

  // Update study session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/study-sessions/${sessionData?.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", videoId, "study-session"],
      });
    },
  });

  const flashcards = flashcardsData?.flashcards || [];
  const session = sessionData?.session;
  const currentCard = flashcards[currentCardIndex];

  // Initialize current card index from session
  useEffect(() => {
    if (session && session.currentCardIndex !== undefined) {
      setCurrentCardIndex(session.currentCardIndex);
    }
  }, [session]);

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setIsFlipped(false);
      
      // Update session
      updateSessionMutation.mutate({
        currentCardIndex: nextIndex,
      });
    } else {
      // Mark session as completed
      updateSessionMutation.mutate({
        completedAt: new Date().toISOString(),
      });
      onComplete();
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      const prevIndex = currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      setIsFlipped(false);
      
      // Update session
      updateSessionMutation.mutate({
        currentCardIndex: prevIndex,
      });
    }
  };

  const handleMarkLearned = () => {
    const completedCards = session?.completedCards || [];
    if (!completedCards.includes(currentCardIndex)) {
      updateSessionMutation.mutate({
        completedCards: [...completedCards, currentCardIndex],
      });
    }
  };

  const handleMarkReview = () => {
    const reviewCards = session?.reviewCards || [];
    if (!reviewCards.includes(currentCardIndex)) {
      updateSessionMutation.mutate({
        reviewCards: [...reviewCards, currentCardIndex],
      });
    }
  };

  const handleShuffle = () => {
    // Simple shuffle - in real app would implement proper shuffle
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    setCurrentCardIndex(randomIndex);
    setIsFlipped(false);
    
    updateSessionMutation.mutate({
      currentCardIndex: randomIndex,
    });
  };

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading flashcards...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Study Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Video Study Session</h2>
          <p className="text-slate-600 mb-4">
            {flashcards.length} flashcards • Study at your own pace
          </p>
          {videoData?.video?.originalName && (
            <p className="text-sm text-slate-500">
              Video: {videoData.video.originalName}
            </p>
          )}
        </div>
        
        {/* Video Player */}
        {videoData?.video?.videoUrl && (
          <div className="flex-1 max-w-md">
            <VideoPlayer 
              videoUrl={videoData.video.videoUrl} 
              className="w-full h-48"
            />
          </div>
        )}
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
            <span className="text-sm text-slate-600">Progress: </span>
            <span className="font-semibold text-slate-900">{currentCardIndex + 1}</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-slate-900">{flashcards.length}</span>
          </div>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="max-w-4xl mx-auto mb-8">
        <motion.div 
          className="relative bg-white rounded-2xl shadow-xl border border-slate-200 min-h-[400px] cursor-pointer"
          onClick={handleCardFlip}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="w-full h-full"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front Side (Question) */}
            <div 
              className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="mb-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Question
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-6 leading-relaxed">
                {currentCard.question}
              </h3>
              <p className="text-slate-500 text-sm">
                <i className="fas fa-mouse-pointer mr-2"></i>
                Click to reveal answer
              </p>
            </div>
            
            {/* Back Side (Answer) */}
            <div 
              className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center"
              style={{ 
                backfaceVisibility: "hidden", 
                transform: "rotateY(180deg)" 
              }}
            >
              <div className="mb-6">
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                  Answer
                </span>
              </div>
              <div className="text-lg lg:text-xl text-slate-800 leading-relaxed">
                {currentCard.answer}
              </div>
              <p className="text-slate-500 text-sm mt-6">
                <i className="fas fa-mouse-pointer mr-2"></i>
                Click to return to question
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Card Navigation */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Previous Button */}
          <button 
            className="bg-white text-slate-700 px-6 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center disabled:opacity-50"
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>
          
          {/* Card Indicators */}
          <div className="flex space-x-2">
            {flashcards.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentCardIndex ? "bg-primary" : "bg-slate-300"
                }`}
              />
            ))}
          </div>
          
          {/* Next Button */}
          <button 
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            onClick={handleNextCard}
          >
            {currentCardIndex === flashcards.length - 1 ? "Complete" : "Next"}
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
        
        {/* Study Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
          <button 
            className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center"
            onClick={handleMarkLearned}
          >
            <i className="fas fa-check mr-2"></i>
            Mark as Learned
          </button>
          <button 
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
            onClick={handleMarkReview}
          >
            <i className="fas fa-star mr-2"></i>
            Need Review
          </button>
          <button 
            className="bg-white text-slate-700 px-6 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center"
            onClick={handleShuffle}
          >
            <i className="fas fa-shuffle mr-2"></i>
            Shuffle Cards
          </button>
        </div>
      </div>
    </div>
  );
}
