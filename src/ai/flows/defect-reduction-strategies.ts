// defect-reduction-strategies.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting defect reduction strategies based on statistical analysis.
 *
 * - suggestDefectReductionStrategies - A function that takes statistical analysis results as input and returns AI-driven suggestions for defect reduction strategies and process improvements.
 * - DefectReductionStrategiesInput - The input type for the suggestDefectReductionStrategies function.
 * - DefectReductionStrategiesOutput - The return type for the suggestDefectReductionStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DefectReductionStrategiesInputSchema = z.object({
  statisticalAnalysis: z.string().describe('The statistical analysis results of the manufacturing defect data.'),
});
export type DefectReductionStrategiesInput = z.infer<typeof DefectReductionStrategiesInputSchema>;

const DefectReductionStrategiesOutputSchema = z.object({
  suggestions: z.string().describe('AI-driven suggestions for defect reduction strategies and process improvements.'),
});
export type DefectReductionStrategiesOutput = z.infer<typeof DefectReductionStrategiesOutputSchema>;

export async function suggestDefectReductionStrategies(input: DefectReductionStrategiesInput): Promise<DefectReductionStrategiesOutput> {
  return defectReductionStrategiesFlow(input);
}

const defectReductionStrategiesPrompt = ai.definePrompt({
  name: 'defectReductionStrategiesPrompt',
  input: {schema: DefectReductionStrategiesInputSchema},
  output: {schema: DefectReductionStrategiesOutputSchema},
  prompt: `Eres un ingeniero de fabricación experto con amplia experiencia en la reducción de defectos.
  Basándote en el análisis estadístico proporcionado, sugiere posibles estrategias de reducción de defectos y mejoras en los procesos.
  Análisis Estadístico: {{{statisticalAnalysis}}}
  Proporciona sugerencias claras y accionables para reducir los costos de fabricación y mejorar la calidad del producto.
  IMPORTANTE: Todas tus respuestas deben ser exclusivamente en español.
`,
});

const defectReductionStrategiesFlow = ai.defineFlow(
  {
    name: 'defectReductionStrategiesFlow',
    inputSchema: DefectReductionStrategiesInputSchema,
    outputSchema: DefectReductionStrategiesOutputSchema,
  },
  async input => {
    const {output} = await defectReductionStrategiesPrompt(input);
    return output!;
  }
);

