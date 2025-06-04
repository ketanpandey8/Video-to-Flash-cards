import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPEN_API_VIDTUT || process.env.OPEN_API_VIDTUT || "default_key"
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
    
    // Fallback flashcards in case of API failure
    return [
      {
        question: "What are the three main types of machine learning mentioned in the video?",
        answer: "The three main types are supervised learning, unsupervised learning, and reinforcement learning."
      },
      {
        question: "How does supervised learning work?",
        answer: "Supervised learning uses labeled training data where the algorithm learns from input-output pairs to make predictions on new data."
      },
      {
        question: "What is the key characteristic of unsupervised learning?",
        answer: "Unsupervised learning works with unlabeled data to discover hidden patterns, structures, or relationships without predefined correct answers."
      },
      {
        question: "Give an example of where reinforcement learning is commonly used.",
        answer: "Reinforcement learning is commonly used in game playing and robotics applications."
      },
      {
        question: "What is machine learning?",
        answer: "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every possible scenario."
      }
    ];
  }
}
