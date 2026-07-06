export function generateQuizPrompt(
  resourceText: string,
  questionCount: number,
  level: string
): string {
  return `You are helping a teacher create an offline quiz.
Generate ${questionCount} questions from the lesson below for level ${level}.
Mix multiple choice and short answer questions.
Return valid JSON only. Do not add explanations or markdown:
{
  "questions": [
    {
      "id": string,
      "type": "multiple_choice" | "short_answer",
      "question": string,
      "options": string[],
      "answer": string,
      "marks": number
    }
  ]
}
Rules:
- multiple_choice questions must have exactly 4 options.
- short_answer questions must have an empty options array.
- For multiple_choice, "answer" must be one of the 4 options.
- Keep language simple.
- Questions must be answerable from the lesson.
Lesson:
${resourceText}`;
}
