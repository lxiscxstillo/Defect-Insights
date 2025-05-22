"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Lightbulb } from 'lucide-react';
import { suggestDefectReductionStrategies } from '@/ai/flows/defect-reduction-strategies';
import type { DefectReductionStrategiesOutput } from '@/ai/flows/defect-reduction-strategies';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiInsightsCardProps {
  initialAnalysisSummary?: string;
}

export default function AiInsightsCard({ initialAnalysisSummary = "" }: AiInsightsCardProps) {
  const [analysisInput, setAnalysisInput] = useState<string>(initialAnalysisSummary);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!analysisInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please provide a summary of statistical analysis.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiSuggestions(null);

    try {
      const result: DefectReductionStrategiesOutput = await suggestDefectReductionStrategies({
        statisticalAnalysis: analysisInput,
      });
      setAiSuggestions(result.suggestions);
      toast({
        title: "AI Insights Generated",
        description: "Suggestions for defect reduction are ready.",
      });
    } catch (err) {
      console.error("AI Insights Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate AI insights: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: `Could not fetch suggestions. ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect to update analysisInput if initialAnalysisSummary changes and is not empty
  // This is useful if the parent component dynamically provides a summary
  useState(() => {
    if (initialAnalysisSummary && initialAnalysisSummary.trim() !== "") {
      setAnalysisInput(initialAnalysisSummary);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAnalysisSummary]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><BrainCircuit className="mr-2 h-6 w-6 text-primary" />AI-Driven Insights</CardTitle>
        <CardDescription>
          Enter a summary of your statistical analysis below. The AI will suggest potential defect reduction strategies and process improvements based on your input.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Paste or type your statistical analysis summary here. For example: 'High repair costs are strongly correlated with defect type X. Severity level Y also shows significantly higher costs...'"
          value={analysisInput}
          onChange={(e) => setAnalysisInput(e.target.value)}
          rows={8}
          className="mb-4"
          disabled={isLoading}
        />
        <Button onClick={handleSubmit} disabled={isLoading || !analysisInput.trim()}>
          {isLoading ? 'Generating Insights...' : 'Get AI Suggestions'}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {aiSuggestions && !isLoading && (
          <div className="mt-6 p-4 border rounded-md bg-secondary/30">
            <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
              <Lightbulb className="mr-2 h-5 w-5 text-accent" />
              Suggested Strategies
            </h3>
            <div className="whitespace-pre-wrap text-sm text-foreground/90">{aiSuggestions}</div>
          </div>
        )}
      </CardContent>
      <CardFooter>
         <p className="text-xs text-muted-foreground">
            AI suggestions are based on the provided summary and general manufacturing knowledge. Always validate with domain experts.
          </p>
      </CardFooter>
    </Card>
  );
}

// Helper component, if needed in future, but not currently used.
const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

