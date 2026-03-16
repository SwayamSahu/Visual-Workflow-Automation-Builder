/**
 * Extracts a JSON string from LLM output.
 * Handles markdown code fences (```json ... ```) and raw JSON objects/arrays.
 */
export function extractJSON(text: string): string {
  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find first JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();

  return text.trim();
}
