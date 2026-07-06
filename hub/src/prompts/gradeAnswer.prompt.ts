export function gradeAnswerPrompt(
  question: string,
  expectedAnswer: string,
  studentAnswer: string,
  maxScore: number
): string {
  return `You are helping a teacher grade student work.
Grade the answer using the marking guide. Be fair and brief.
The maximum score for this question is ${maxScore}.
Return JSON only. Do not add explanations or markdown:
{
  "score": number,
  "maxScore": number,
  "feedback": string,
  "misconception": string
}
Question:
${question}
Expected Answer:
${expectedAnswer}
Student Answer:
${studentAnswer}`;
}
