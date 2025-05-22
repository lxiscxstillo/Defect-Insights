
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
      return "No hay datos cargados todavía. Por favor, cargue datos de defectos de fabricación para realizar el análisis.";
    }
    const repairCosts = defectData.map(d => d.repair_cost);
    const stats = calculateDescriptiveStats(repairCosts);
    
    let summary = `Análisis de ${defectData.length} registros de defectos:\n`;
    if (stats) {
      summary += `- Costos de Reparación: Media $${stats.mean.toFixed(2)}, Mediana $${stats.median.toFixed(2)}, Desv. Est. $${stats.stdDev.toFixed(2)}. Rango de $${stats.min.toFixed(2)} a $${stats.max.toFixed(2)}.\n`;
    } else {
      summary += "- No se pudieron calcular las estadísticas de costos de reparación.\n";
    }
    
    const defectTypes = new Set(defectData.map(d => d.defect_type));
    summary += `- Se observaron ${defectTypes.size} tipos de defectos únicos.\n`;

    const severities = new Set(defectData.map(d => d.severity));
    summary += `- Se observaron ${severities.size} niveles de severidad únicos.\n`;
    
    // You can add more details here based on frequency distributions etc.
    // For brevity, keeping it simple.
    summary += "\nPor favor, proporcione hallazgos más detallados o áreas específicas de preocupación para sugerencias de IA específicas.";
    
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
        Análisis de Defectos &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
