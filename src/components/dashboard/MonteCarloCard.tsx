
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { DefectRecord, MonteCarloResult } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart as LBarChart, Activity, HelpCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useToast } from "@/hooks/use-toast";

interface MonteCarloCardProps {
  data: DefectRecord[];
}

const NUM_SIMULATIONS = 10000; 

const reductionScenarios = [0, 0.1, 0.2, 0.3]; // 0%, 10%, 20%, 30% reduction

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const scenarioData = payload[0].payload; // Full data object for the bar
    return (
      <div className="bg-card p-2 border border-border rounded shadow-lg text-sm">
        <p className="font-semibold">{scenarioData.name}</p> {/* Changed from scenarioData.scenario to scenarioData.name to match chart dataKey */}
        <p>Costo Medio: ${scenarioData['Costo Total Medio']?.toFixed(2) ?? scenarioData.meanCost?.toFixed(2)}</p>
        <p>Desv. Est.: ${scenarioData.stdDevCost?.toFixed(2)}</p>
        <p>Costo P5: ${scenarioData.percentiles?.p5.toFixed(2)}</p>
        <p>Costo Mediana: ${scenarioData.percentiles?.p50.toFixed(2)}</p>
        <p>Costo P95: ${scenarioData.percentiles?.p95.toFixed(2)}</p>
        {typeof scenarioData['Ahorros Esperados'] === 'number' && <p>Ahorros: ${scenarioData['Ahorros Esperados'].toFixed(2)}</p>}
        {typeof scenarioData.expectedSavings === 'number' && typeof scenarioData['Ahorros Esperados'] === 'undefined' && <p>Ahorros: ${scenarioData.expectedSavings.toFixed(2)}</p>}
      </div>
    );
  }
  return null;
};


export default function MonteCarloCard({ data }: MonteCarloCardProps) {
  const [simulationResults, setSimulationResults] = useState<MonteCarloResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formattedNumSimulations, setFormattedNumSimulations] = useState<string | number>(NUM_SIMULATIONS.toString());
  const { toast } = useToast();

  useEffect(() => {
    try {
        setFormattedNumSimulations(NUM_SIMULATIONS.toLocaleString('es-ES'));
    } catch (e) {
        setFormattedNumSimulations(NUM_SIMULATIONS.toLocaleString());
    }
  }, []);

  const repairCosts = useMemo(() => data.map(d => d.repair_cost), [data]);

  const runSimulation = async () => {
    if (repairCosts.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin Datos",
        description: "No se puede ejecutar la simulación sin datos de defectos importados.",
      });
      return;
    }

    setIsLoading(true);
    setSimulationResults([]);
    setProgress(0);

    const results: MonteCarloResult[] = [];
    const totalSteps = reductionScenarios.length * NUM_SIMULATIONS;
    let currentStep = 0;

    for (const reduction of reductionScenarios) {
      const numDefectsToSample = Math.floor(repairCosts.length * (1 - reduction));
      const scenarioTotalCosts: number[] = [];

      for (let i = 0; i < NUM_SIMULATIONS; i++) {
        let currentTotalCost = 0;
        for (let j = 0; j < numDefectsToSample; j++) {
          const randomIndex = Math.floor(Math.random() * repairCosts.length);
          currentTotalCost += repairCosts[randomIndex];
        }
        scenarioTotalCosts.push(currentTotalCost);
        
        currentStep++;
        if (i % (NUM_SIMULATIONS / 100) === 0) { 
            setProgress(Math.round((currentStep / totalSteps) * 100));
            await new Promise(resolve => setTimeout(resolve, 0)); 
        }
      }
      
      scenarioTotalCosts.sort((a, b) => a - b);
      const meanCost = scenarioTotalCosts.reduce((sum, cost) => sum + cost, 0) / NUM_SIMULATIONS;
      const variance = scenarioTotalCosts.reduce((sum, cost) => sum + Math.pow(cost - meanCost, 2), 0) / (NUM_SIMULATIONS > 1 ? (NUM_SIMULATIONS -1) : 1);
      const stdDevCost = Math.sqrt(variance);
      
      results.push({
        scenario: `${reduction * 100}% Reducción`,
        totalCosts: scenarioTotalCosts, 
        meanCost,
        stdDevCost,
        percentiles: {
          p5: scenarioTotalCosts[Math.floor(NUM_SIMULATIONS * 0.05)] ?? 0,
          p50: scenarioTotalCosts[Math.floor(NUM_SIMULATIONS * 0.50)] ?? 0,
          p95: scenarioTotalCosts[Math.floor(NUM_SIMULATIONS * 0.95)] ?? 0,
        },
      });
    }
    
    const baselineMeanCost = results.find(r => r.scenario === "0% Reducción")?.meanCost;
    if (typeof baselineMeanCost === 'number') {
      results.forEach(r => {
        if (r.scenario !== "0% Reducción") {
          r.expectedSavings = baselineMeanCost - r.meanCost;
        }
      });
    }

    setSimulationResults(results);
    setIsLoading(false);
    setProgress(100);
    toast({
      title: "Simulación Completa",
      description: "La simulación de Monte Carlo finalizó para todos los escenarios.",
    });
  };
  
  const chartDataMean = simulationResults.map(r => ({
    name: r.scenario,
    "Costo Total Medio": r.meanCost,
    meanCost: r.meanCost, // Keep original for tooltip if needed
    stdDevCost: r.stdDevCost,
    percentiles: r.percentiles,
    expectedSavings: r.expectedSavings,
  }));

  const chartDataSavings = simulationResults
    .filter(r => typeof r.expectedSavings === 'number')
    .map(r => ({
      name: r.scenario,
      "Ahorros Esperados": r.expectedSavings,
      meanCost: r.meanCost,
      stdDevCost: r.stdDevCost,
      percentiles: r.percentiles,
      expectedSavings: r.expectedSavings,
    }));


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Activity className="mr-2 h-6 w-6 text-primary" />Simulación de Monte Carlo</CardTitle>
        <CardDescription>
          Simule los costos totales de reparación bajo diferentes escenarios de reducción de defectos (0%, 10%, 20%, 30%). 
          Cada escenario ejecuta {formattedNumSimulations} simulaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runSimulation} disabled={isLoading || data.length === 0} className="mb-4">
          {isLoading ? 'Ejecutando Simulación...' : 'Ejecutar Simulación'}
        </Button>
        {isLoading && <Progress value={progress} className="w-full mb-4" />}

        {simulationResults.length > 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Resumen de Resultados de Simulación</h3>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escenario</TableHead>
                      <TableHead className="text-right">Costo Medio</TableHead>
                      <TableHead className="text-right">Desv. Est.</TableHead>
                      <TableHead className="text-right">Costo P5</TableHead>
                      <TableHead className="text-right">Costo Mediana</TableHead>
                      <TableHead className="text-right">Costo P95</TableHead>
                      <TableHead className="text-right">Ahorros Esperados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulationResults.map((res) => (
                      <TableRow key={res.scenario}>
                        <TableCell>{res.scenario}</TableCell>
                        <TableCell className="text-right">${res.meanCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${res.stdDevCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${res.percentiles.p5.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${res.percentiles.p50.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${res.percentiles.p95.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {typeof res.expectedSavings === 'number' ? `$${res.expectedSavings.toFixed(2)}` : 'N/D'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center">
                <HelpCircle className="h-3 w-3 mr-1" /> 
                Los diagramas de caja comparativos se representan mediante datos percentiles (P5, Mediana, P95).
                Los datos de distribución completa ({formattedNumSimulations} puntos por escenario) están disponibles pero no se grafican directamente por rendimiento.
              </p>
            </div>
            
            {chartDataMean.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Comparación de Costos Totales Medios</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataMean} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}/>
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value.toLocaleString('es-ES')}`} tick={{ fontSize: 12 }}/>
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--primary), 0.1)' }} />
                      <Legend />
                      <Bar dataKey="Costo Total Medio" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este gráfico de barras compara el costo total medio de reparación estimado para cada escenario de reducción de defectos. Un costo menor indica un mayor ahorro potencial. Cada barra representa un escenario diferente (ej. 0% reducción, 10% reducción, etc.).
                </p>
              </div>
            )}

            {chartDataSavings.length > 0 && (
               <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Comparación de Ahorros Esperados</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataSavings} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}/>
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value.toLocaleString('es-ES')}`} tick={{ fontSize: 12 }}/>
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent), 0.1)' }} />
                      <Legend />
                      <Bar dataKey="Ahorros Esperados" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este gráfico de barras muestra los ahorros esperados en los costos totales de reparación para cada escenario de reducción de defectos, en comparación con el escenario base (0% de reducción). Barras más altas indican mayores ahorros.
                </p>
              </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}

