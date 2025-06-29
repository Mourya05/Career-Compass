'use server';

/**
 * @fileOverview Analyzes the compatibility between a user's current job description and a target job description.
 *
 * - analyzeCompatibility - A function that handles the compatibility analysis process.
 * - AnalyzeCompatibilityInput - The input type for the analyzeCompatibility function.
 * - AnalyzeCompatibilityOutput - The return type for the analyzeCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCompatibilityInputSchema = z.object({
  currentUserDescription: z
    .string()
    .describe('The current job description of the user.'),
  targetJobDescription: z
    .string()
    .describe('The target job description to compare against.'),
});
export type AnalyzeCompatibilityInput = z.infer<typeof AnalyzeCompatibilityInputSchema>;

const AnalyzeCompatibilityOutputSchema = z.object({
  compatibilityAnalysis: z.string().describe('Detailed analysis of the compatibility between the two job descriptions.'),
  skillGaps: z.string().describe('List of skill gaps identified between the two job descriptions.'),
  atsScore: z.number().describe('The ATS (Applicant Tracking System) score based on the compatibility analysis.'),
});
export type AnalyzeCompatibilityOutput = z.infer<typeof AnalyzeCompatibilityOutputSchema>;

export async function analyzeCompatibility(input: AnalyzeCompatibilityInput): Promise<AnalyzeCompatibilityOutput> {
  return analyzeCompatibilityFlow(input);
}

const analyzeCompatibilityPrompt = ai.definePrompt({
  name: 'analyzeCompatibilityPrompt',
  input: {schema: AnalyzeCompatibilityInputSchema},
  output: {schema: AnalyzeCompatibilityOutputSchema},
  prompt: `You are an expert career advisor specializing in analyzing job descriptions and identifying compatibility.

You will analyze the compatibility between the user's current job description and the target job description, identify skill gaps, and provide an ATS score.

Current Job Description: {{{currentUserDescription}}}
Target Job Description: {{{targetJobDescription}}}

Analyze the compatibility, identify skill gaps, and provide an ATS score (0-100) based on the analysis. The ATS score should reflect how well the current job description matches the target job description.
\nCompatibility Analysis: 
Skill Gaps: 
ATS Score: `,
});

const analyzeCompatibilityFlow = ai.defineFlow(
  {
    name: 'analyzeCompatibilityFlow',
    inputSchema: AnalyzeCompatibilityInputSchema,
    outputSchema: AnalyzeCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await analyzeCompatibilityPrompt(input);
    // Ensure the ATS score is within the valid range (0-100)
    if (output && output.atsScore < 0) {
      output.atsScore = 0;
    } else if (output && output.atsScore > 100) {
      output.atsScore = 100;
    }
    return output!;
  }
);
