import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPEN_API_VIDTUT || "default_key"
});

export interface FlashcardPair {
  question: string;
  answer: string;
}

export async function generateFlashcards(transcription: string): Promise<FlashcardPair[]> {
  // Validate input transcription
  if (!transcription || transcription.length < 100) {
    throw new Error("Transcription is too short to generate meaningful flashcards");
  }
  
  if (transcription.toLowerCase().includes("error") || 
      transcription.toLowerCase().includes("failed") ||
      transcription.toLowerCase().includes("api key") ||
      transcription.toLowerCase().includes("quota") ||
      transcription.toLowerCase().includes("billing") ||
      transcription.length > 50000) {
    throw new Error("Cannot generate flashcards from error messages or invalid transcriptions");
  }

  // Check if transcription contains actual educational content
  const educationalKeywords = ['learn', 'understand', 'concept', 'definition', 'explain', 'example', 'important', 'key', 'topic', 'subject'];
  const hasEducationalContent = educationalKeywords.some(keyword => 
    transcription.toLowerCase().includes(keyword)
  );
  
  if (!hasEducationalContent) {
    throw new Error("Transcription does not appear to contain educational content suitable for flashcards");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Generate exactly 8-10 high-quality flashcard question-answer pairs from the provided video transcription. 

CRITICAL REQUIREMENTS:
- Questions MUST be directly based on the specific content provided
- Do NOT create generic or unrelated questions
- Focus on key concepts, definitions, and important facts from the actual transcription
- Questions should test understanding of the specific material presented
- Answers should be clear, concise, and educational
- Cover different aspects of the actual content provided
- Use varied question types (what, how, why, compare, etc.) but keep them relevant

VALIDATION:
- Each question must reference specific information from the transcription
- Answers must be factually accurate to the content provided
- Do not add external knowledge not mentioned in the transcription

Respond with JSON in this exact format:
{
  "flashcards": [
    {
      "question": "Based on the content, what is [specific concept from transcription]?",
      "answer": "According to the material, [specific answer from transcription content]"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Generate flashcards from this video transcription:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.flashcards || !Array.isArray(result.flashcards)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result.flashcards.map((card: any) => ({
      question: card.question || "",
      answer: card.answer || ""
    })).filter((card: FlashcardPair) => card.question && card.answer);

  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    
    // Check if it's an API key issue
    if (error instanceof Error) {
      if (error.message.includes("Incorrect API key") || error.message.includes("401")) {
        console.error("OpenAI API Key Error: Please check your OPEN_API_VIDTUT secret");
        throw new Error("Invalid OpenAI API key. Please check your OPEN_API_VIDTUT secret in Replit.");
      }
      if (error.message.includes("quota") || error.message.includes("billing")) {
        console.error("OpenAI API Quota Error:", error.message);
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      }
      if (error.message.includes("rate limit")) {
        console.error("OpenAI API Rate Limit Error:", error.message);
        throw new Error("OpenAI API rate limit exceeded. Please try again later.");
      }
    }
    
    // For other errors, throw them to be handled by the caller
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
