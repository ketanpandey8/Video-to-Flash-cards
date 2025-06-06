import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UploadSectionProps {
  onVideoUploaded: (videoId: number) => void;
}

export default function UploadSection({ onVideoUploaded }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "Your video is being processed...",
      });
      onVideoUploaded(data.video.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const urlUploadMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "URL upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "URL upload successful",
        description: "Your video is being processed...",
      });
      onVideoUploaded(data.video.id);
    },
    onError: (error: Error) => {
      toast({
        title: "URL upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP4, MOV, or AVI file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 500MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUrlUpload = () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    urlUploadMutation.mutate(videoUrl);
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Transform Videos into Smart Flashcards
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload your educational videos and let AI generate personalized Q&A flashcards for enhanced learning
        </p>
      </div>

      {/* Upload Method Selection */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-md border border-slate-200">
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              uploadMethod === 'url'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setUploadMethod('url')}
          >
            <i className="fas fa-link mr-2"></i>
            Video URL
          </button>
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              uploadMethod === 'file'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setUploadMethod('file')}
          >
            <i className="fas fa-upload mr-2"></i>
            File Upload
          </button>
        </div>
      </div>

      {uploadMethod === 'url' ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center max-w-4xl mx-auto">
          <div className="mb-6">
            <i className="fas fa-link text-6xl text-slate-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter Video URL</h3>
            <p className="text-slate-600">Paste a direct link to your video file</p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-6">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center"
            />
          </div>
          
          <div className="flex justify-center mb-6">
            <button 
              className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={handleUrlUpload}
              disabled={urlUploadMutation.isPending || !videoUrl.trim()}
            >
              <i className="fas fa-download mr-2"></i>
              {urlUploadMutation.isPending ? "Processing..." : "Process Video"}
            </button>
          </div>
          
          <div className="text-sm text-slate-500">
            <p className="mb-2">Sample video prefilled for quick demo</p>
            <div className="flex justify-center space-x-4 text-xs">
              <span className="bg-slate-100 px-3 py-1 rounded-full">Direct URL</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">MP4/MOV/AVI</span>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-300 hover:border-primary transition-colors p-12 text-center max-w-4xl mx-auto cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="mb-6">
            <i className="fas fa-cloud-upload-alt text-6xl text-slate-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Your Video</h3>
            <p className="text-slate-600">Drag and drop your video file here, or click to browse</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <button 
              className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              disabled={uploadMutation.isPending}
            >
              <i className="fas fa-folder-open mr-2"></i>
              {uploadMutation.isPending ? "Uploading..." : "Choose File"}
            </button>
          </div>
          
          <div className="text-sm text-slate-500">
            <p className="mb-2">Supported formats: MP4, MOV, AVI (Max 500MB)</p>
            <div className="flex justify-center space-x-4 text-xs">
              <span className="bg-slate-100 px-3 py-1 rounded-full">.mp4</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">.mov</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">.avi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
