export function classInsightPrompt(submissionsJson: string): string {
  return `You are a teaching assistant.
Analyze the class submissions and identify:
1. common misunderstandings
2. topics to revise
3. suggested next classroom activity
Return simple JSON only. Do not add explanations or markdown:
{
  "summary": string,
  "commonMisconceptions": string[],
  "recommendedRevision": string,
  "nextActivity": string
}
Submissions:
${submissionsJson}`;
}
