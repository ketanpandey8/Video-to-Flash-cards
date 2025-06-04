import { useQuery } from "@tanstack/react-query";

interface CompletionSectionProps {
  videoId: number;
  onStartOver: () => void;
}

export default function CompletionSection({ videoId, onStartOver }: CompletionSectionProps) {
  // Fetch study session data
  const { data: sessionData } = useQuery({
    queryKey: ["/api/videos", videoId, "study-session"],
  });

  // Fetch flashcards to get total count
  const { data: flashcardsData } = useQuery({
    queryKey: ["/api/videos", videoId, "flashcards"],
  });

  const session = sessionData?.session;
  const flashcards = flashcardsData?.flashcards || [];
  const learnedCount = session?.completedCards?.length || 0;
  const reviewCount = session?.reviewCards?.length || 0;
  const totalCards = flashcards.length;

  // Calculate study time (mock data for now)
  const studyTimeMinutes = 12;

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-trophy text-3xl text-secondary"></i>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Study Session Complete!</h3>
        <p className="text-slate-600 mb-8">
          Great job! You've completed all {totalCards} flashcards. Your progress has been saved.
        </p>
        
        {/* Study Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">{learnedCount}</div>
            <div className="text-sm text-slate-600">Learned</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">{reviewCount}</div>
            <div className="text-sm text-slate-600">Need Review</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">{studyTimeMinutes}m</div>
            <div className="text-sm text-slate-600">Study Time</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button 
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Study Again
          </button>
          <button 
            className="bg-white text-slate-700 px-6 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={onStartOver}
          >
            Upload New Video
          </button>
        </div>
      </div>
    </div>
  );
}
