import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-compatibility.ts';
import '@/ai/flows/suggest-skills.ts';
import '@/ai/flows/recommend-certifications.ts';
import '@/ai/flows/build-resume.ts';