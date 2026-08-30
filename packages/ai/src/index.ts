/**
 * @zerocorp/ai — Layer 3
 *
 * Text, image, transcription and embedding providers behind one interface, plus
 * task-based model routing and cost accounting.
 *
 * Every structured model output is schema-validated against @zerocorp/contracts
 * before it can reach a domain service. An LLM is never a database writer.
 */
export const AI_PACKAGE = "@zerocorp/ai" as const;
