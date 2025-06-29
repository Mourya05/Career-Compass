// src/ai/flows/build-resume.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for building a resume based on user skills and qualifications,
 * optimized for ATS (Applicant Tracking Systems).
 *
 * - buildResume - A function that builds an ATS-friendly resume.
 * - BuildResumeInput - The input type for the buildResume function.
 * - BuildResumeOutput - The return type for the buildResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BuildResumeInputSchema = z.object({
  jobDescription: z.string().describe('The target job description.'),
  skills: z.array(z.string()).describe('A list of skills to include in the resume.'),
  qualifications: z.string().describe('A description of the user qualifications, including contact details, work experience, and education.'),
});
export type BuildResumeInput = z.infer<typeof BuildResumeInputSchema>;

const BuildResumeOutputSchema = z.object({
  resume: z.string().describe('The generated ATS-friendly resume content in plain text.'),
});
export type BuildResumeOutput = z.infer<typeof BuildResumeOutputSchema>;

export async function buildResume(input: BuildResumeInput): Promise<BuildResumeOutput> {
  return buildResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'buildResumePrompt',
  input: {schema: BuildResumeInputSchema},
  output: {schema: BuildResumeOutputSchema},
  prompt: `You are an expert resume writer specializing in creating ATS-friendly resumes.
The resume must be plain text, optimized for Applicant Tracking Systems.

Follow this structure strictly:

1.  **Contact Information:** (Extract from Qualifications if available, otherwise use placeholders or omit)
    *   Full Name
    *   Phone Number
    *   Email Address
    *   LinkedIn Profile URL (Optional)
    *   Location (City, State)

2.  **Summary/Objective:**
    *   A brief 2-4 sentence summary tailored to the Job Description: {{{jobDescription}}}, highlighting key skills and qualifications from: {{{qualifications}}}.

3.  **Skills:**
    *   A bulleted or comma-separated list of relevant skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    *   Consider categorizing if appropriate (e.g., Technical Skills, Soft Skills) based on the skills provided.

4.  **Work Experience:** (Extract from Qualifications: {{{qualifications}}})
    *   List in reverse chronological order.
    *   For each role:
        *   Job Title
        *   Company Name, City, State
        *   Dates of Employment (Month Year - Month Year or Month Year - Present)
        *   Use 2-4 bullet points to describe responsibilities and achievements, incorporating keywords from the Job Description and Qualifications. Start each bullet point with an action verb.

5.  **Education:** (Extract from Qualifications: {{{qualifications}}})
    *   List in reverse chronological order.
    *   For each degree:
        *   Degree Name
        *   University Name, City, State
        *   Graduation Date (Month Year or Expected Month Year)
        *   Relevant coursework or honors (Optional)

6.  **Projects (Optional, if relevant from Qualifications: {{{qualifications}}}):**
    *   Project Title
    *   Brief description and your role/achievements.

Ensure the entire output is a single block of plain text.
Use simple line breaks for separation. Do not use markdown for headers (like ## or **), use plain text titles for sections followed by a colon or a line break.
Avoid tables, columns, or special characters that might not parse well in an ATS.

Resume:
`,
});

const buildResumeFlow = ai.defineFlow(
  {
    name: 'buildResumeFlow',
    inputSchema: BuildResumeInputSchema,
    outputSchema: BuildResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
