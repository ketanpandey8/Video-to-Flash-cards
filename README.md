# Video-to-Flash-cards

**Video-to-Flash-cards** is a TypeScript-based application that allows users to upload or provide a URL to a video, automatically transcribes the video using OpenAI Whisper, and then generates flashcards from the transcribed content using OpenAI. The resulting flashcards help users study and review key information from the video.

## Features

- **Video Upload & URL Input**: Upload videos directly or provide a YouTube URL for processing.
- **Automated Transcription**: Extracts audio from videos and transcribes it using OpenAI Whisper.
- **Flashcard Generation**: Automatically generates question-answer flashcards based on the video transcription using OpenAI.
- **Study Sessions**: Organizes flashcards into study sessions for effective learning.
- **Status Tracking**: Monitors the progress of uploads, processing, and flashcard generation.

## How it Works

1. **Upload or Provide Video URL**: The user uploads a video file or provides a YouTube link.
2. **Audio Extraction & Transcription**: 
   - Audio is extracted from the video (using FFmpeg).
   - The audio is transcribed using OpenAI Whisper.
3. **Flashcard Creation**:
   - The transcription is processed by OpenAI to generate flashcards.
   - Each flashcard contains a question and answer based on the video content.
4. **Study Mode**: Users can review and interact with the flashcards generated from their video.

## Technologies Used

- **TypeScript** (98.8%)
- **Node.js**
- **React** (for frontend)
- **Vite** (build tool)
- **FFmpeg** (for audio extraction)
- **yt-dlp** (for downloading YouTube videos)
- **OpenAI Whisper** (for transcription)
- **OpenAI API** (for flashcard generation)

## Directory Structure

```
client/        # React frontend
server/        # Node.js/Express backend, video and flashcard logic
shared/        # Shared types and schemas
attached_assets/ # Static assets
```

## Setup & Installation

1. **Install dependencies**:

    ```bash
    npm install
    ```

2. **Environment Variables**:
    - Set `OPEN_API_VIDTUT` in your environment for OpenAI API access.
    - Ensure `ffmpeg` and `yt-dlp` are installed and available in your PATH.

3. **Run the Application**:

    ```bash
    npm run dev
    ```

## API Overview

- **Video Processing**: Handles uploads, status, and transcription.
- **Flashcard Generation**: Generates and serves flashcards per video.
- **Study Sessions**: Organizes flashcards for spaced repetition.

## Limitations

- Only YouTube URLs are supported for video link processing; other sources require direct upload.
- Requires OpenAI API key and local installations of `ffmpeg` and `yt-dlp`.

## Contributing

Feel free to open issues or submit pull requests!

## License

[MIT](LICENSE)
