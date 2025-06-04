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
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Generate 8-10 high-quality flashcard question-answer pairs from the provided video transcription. 

Requirements:
- Focus on key concepts, definitions, and important facts
- Questions should test understanding, not just memorization
- Answers should be clear, concise, and educational
- Cover different aspects of the content
- Use varied question types (what, how, why, compare, etc.)

Respond with JSON in this exact format:
{
  "flashcards": [
    {
      "question": "What is the main difference between supervised and unsupervised learning?",
      "answer": "Supervised learning uses labeled training data where the algorithm learns from input-output pairs to make predictions on new data. Unsupervised learning works with unlabeled data to discover hidden patterns, structures, or relationships without predefined correct answers."
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
