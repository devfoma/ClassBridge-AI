export function summarizeResourcePrompt(
  resourceText: string,
  subject: string,
  level: string
): string {
  return `You are an educational assistant for a low-connectivity school.
Analyze this lesson resource and return valid JSON only. Do not add explanations or markdown.
The subject is "${subject}" and the level is "${level}".
Return:
{
  "title": string,
  "subject": string,
  "level": string,
  "topics": string[],
  "summary": string,
  "prerequisites": string[],
  "suggestedActivity": string
}
Resource:
${resourceText}`;
}
