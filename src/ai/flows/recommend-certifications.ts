//Recommend certifications to pursue based on the identified skill gaps and current job market trends.

'use server';

/**
 * @fileOverview Recommends relevant certifications to pursue, using an AI reasoning tool, based on skills and job market trends.
 *
 * - recommendCertifications - A function that recommends certifications based on skill gaps and job market trends.
 * - RecommendCertificationsInput - The input type for the recommendCertifications function.
 * - RecommendCertificationsOutput - The return type for the recommendCertifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendCertificationsInputSchema = z.object({
  skillGaps: z
    .string()
    .describe('The identified skill gaps between the user and the target job description.'),
  jobMarketTrends: z
    .string()
    .describe('The current job market trends for the target job.'),
});
export type RecommendCertificationsInput = z.infer<typeof RecommendCertificationsInputSchema>;

const RecommendCertificationsOutputSchema = z.object({
  certifications: z.array(
    z.object({
      name: z.string().describe('The name of the recommended certification.'),
      url: z.string().optional().describe('A relevant URL for the certification (e.g., provider website, information page). If a valid URL is not found, this field can be omitted.')
    })
  ).describe('A list of relevant certifications to pursue, including their names and URLs if available.')
});
export type RecommendCertificationsOutput = z.infer<typeof RecommendCertificationsOutputSchema>;

export async function recommendCertifications(
  input: RecommendCertificationsInput
): Promise<RecommendCertificationsOutput> {
  return recommendCertificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendCertificationsPrompt',
  input: {schema: RecommendCertificationsInputSchema},
  output: {schema: RecommendCertificationsOutputSchema},
  prompt: `You are a career advisor that specializes in recommending certifications based on skill gaps and job market trends.

  Based on the identified skill gaps and current job market trends, recommend relevant certifications to pursue.
  For each certification, provide its name and a direct URL to the certification provider or an official information page if available.
  If a URL is not readily available or a valid one cannot be found, you may omit the url field for that certification. Ensure any provided URLs are valid.

  Skill Gaps: {{{skillGaps}}}
  Job Market Trends: {{{jobMarketTrends}}}
  `,
});

const recommendCertificationsFlow = ai.defineFlow(
  {
    name: 'recommendCertificationsFlow',
    inputSchema: RecommendCertificationsInputSchema,
    outputSchema: RecommendCertificationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
