export function tutorHintPrompt(question: string, studentAnswer: string): string {
  return `You are an offline classroom tutor.
Give a short hint that helps the student think.
Do not directly give the final answer.
Return JSON only. Do not add explanations or markdown:
{
  "hint": string,
  "relatedTopic": string
}
Question:
${question}
Student's current attempt:
${studentAnswer}`;
}
