'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest relevant skills to acquire based on the compatibility analysis
 * between a user's current description and a target job description.
 *
 * - suggestSkills - A function that suggests skills to acquire.
 * - SuggestSkillsInput - The input type for the suggestSkills function.
 * - SuggestSkillsOutput - The return type for the suggestSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSkillsInputSchema = z.object({
  userDescription: z
    .string()
    .describe('The current description of the user, including skills and experience.'),
  jobDescription: z.string().describe('The target job description.'),
  compatibilityAnalysis: z
    .string()
    .optional()
    .describe('The compatibility analysis between the user and job description.'),
});
export type SuggestSkillsInput = z.infer<typeof SuggestSkillsInputSchema>;

const SuggestSkillsOutputSchema = z.object({
  suggestedSkills: z
    .array(z.string())
    .describe('An array of suggested skills to acquire.'),
  reasoning: z
    .string()
    .optional()
    .describe('The reasoning behind the skill suggestions.'),
});
export type SuggestSkillsOutput = z.infer<typeof SuggestSkillsOutputSchema>;

export async function suggestSkills(input: SuggestSkillsInput): Promise<SuggestSkillsOutput> {
  return suggestSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSkillsPrompt',
  input: {schema: SuggestSkillsInputSchema},
  output: {schema: SuggestSkillsOutputSchema},
  prompt: `You are an expert career advisor.

You will analyze the user's current description and the target job description to identify skill gaps.
Based on this analysis, you will suggest a list of relevant skills to acquire to improve the user's compatibility with the target job.

User Description: {{{userDescription}}}
Job Description: {{{jobDescription}}}
Compatibility Analysis: {{{compatibilityAnalysis}}}

Suggest skills that can bridge the gap between the user's current skills and the requirements of the target job.
Return the suggested skills as an array of strings.
Also, provide a brief reasoning for why each skill is suggested.
`,
});

const suggestSkillsFlow = ai.defineFlow(
  {
    name: 'suggestSkillsFlow',
    inputSchema: SuggestSkillsInputSchema,
    outputSchema: SuggestSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
