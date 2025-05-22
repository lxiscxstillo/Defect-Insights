"use client";

import { useState, useMemo } from 'react';
import type { DefectRecord, NumericalStats } from '@/types';
import Header from '@/components/navigation/Header';
import DataImportCard from '@/components/dashboard/DataImportCard';
import DescriptiveStatsCard from '@/components/dashboard/DescriptiveStatsCard';
import MonteCarloCard from '@/components/dashboard/MonteCarloCard';
import AiInsightsCard from '@/components/dashboard/AiInsightsCard';
import { calculateDescriptiveStats } from '@/lib/statistics'; // For initial AI summary

export default function HomePage() {
  const [defectData, setDefectData] = useState<DefectRecord[]>([]);

  const handleDataLoaded = (data: DefectRecord[]) => {
    setDefectData(data);
  };

  // Generate a simple summary for AI card when data is loaded.
  const analysisSummaryForAI = useMemo(() => {
    if (defectData.length === 0) {
      return "No data loaded yet. Please upload manufacturing defect data to perform analysis.";
    }
    const repairCosts = defectData.map(d => d.repair_cost);
    const stats = calculateDescriptiveStats(repairCosts);
    
    let summary = `Analysis of ${defectData.length} defect records:\n`;
    if (stats) {
      summary += `- Repair Costs: Mean $${stats.mean.toFixed(2)}, Median $${stats.median.toFixed(2)}, StdDev $${stats.stdDev.toFixed(2)}. Range from $${stats.min.toFixed(2)} to $${stats.max.toFixed(2)}.\n`;
    } else {
      summary += "- Repair cost statistics could not be calculated.\n";
    }
    
    const defectTypes = new Set(defectData.map(d => d.defect_type));
    summary += `- Observed ${defectTypes.size} unique defect types.\n`;

    const severities = new Set(defectData.map(d => d.severity));
    summary += `- Observed ${severities.size} unique severity levels.\n`;
    
    // You can add more details here based on frequency distributions etc.
    // For brevity, keeping it simple.
    summary += "\nPlease provide more detailed findings or specific areas of concern for targeted AI suggestions.";
    
    return summary;
  }, [defectData]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <DataImportCard onDataLoaded={handleDataLoaded} />
          </div>
          
          <DescriptiveStatsCard data={defectData} />
          <MonteCarloCard data={defectData} />
          
          <div className="lg:col-span-2">
            <AiInsightsCard initialAnalysisSummary={analysisSummaryForAI} />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        Defect Insights &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
