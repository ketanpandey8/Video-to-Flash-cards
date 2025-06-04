
import React from 'react';

interface VideoPlayerProps {
  videoUrl?: string;
  className?: string;
}

export default function VideoPlayer({ videoUrl, className = "" }: VideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-slate-500">No video URL available</p>
      </div>
    );
  }

  // YouTube URL detection and embedding
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return (
        <div className={`relative ${className}`}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        </div>
      );
    }
  }

  // Vimeo URL detection and embedding
  if (videoUrl.includes('vimeo.com')) {
    const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
    
    if (videoId) {
      return (
        <div className={`relative ${className}`}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        </div>
      );
    }
  }

  // Direct video file URLs
  if (videoUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
    return (
      <video
        src={videoUrl}
        controls
        className={`w-full rounded-lg ${className}`}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  // Fallback for other URLs - try direct video element
  return (
    <div className={`relative ${className}`}>
      <video
        src={videoUrl}
        controls
        className="w-full h-full rounded-lg"
        preload="metadata"
        onError={(e) => {
          console.warn('Failed to load video:', videoUrl);
        }}
      >
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <p className="text-slate-600 text-sm">Video: {videoUrl}</p>
      </div>
    </div>
  );
}
