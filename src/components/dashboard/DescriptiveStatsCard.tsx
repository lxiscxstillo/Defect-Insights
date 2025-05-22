
"use client";

import type { DefectRecord, NumericalStats, FrequencyDistribution } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart as LBarChart, PieChart as LPieChart, LineChart as LLineChart, TrendingUp, ListChecks } from 'lucide-react';
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
import { calculateDescriptiveStats, calculateFrequencyDistribution, createHistogramData } from '@/lib/statistics';
import { useMemo } from 'react';

interface DescriptiveStatsCardProps {
  data: DefectRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-2 border border-border rounded shadow-lg">
        <p className="label text-sm font-medium">{`${label}`}</p>
        <p className="intro text-sm text-foreground">{`Conteo : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


export default function DescriptiveStatsCard({ data }: DescriptiveStatsCardProps) {
  const repairCosts = useMemo(() => data.map(d => d.repair_cost), [data]);
  const stats = useMemo(() => calculateDescriptiveStats(repairCosts), [repairCosts]);

  const defectTypeFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.defect_type)), [data]);
  const severityFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.severity)), [data]);
  const locationFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.defect_location)), [data]);
  const inspectionFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.inspection_method)), [data]);

  const histogramData = useMemo(() => createHistogramData(repairCosts, 10), [repairCosts]);
  
  const formatFrequencyDataForChart = (freq: FrequencyDistribution) => {
    return Object.entries(freq).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0,10); // Top 10
  };

  if (data.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" />Estadísticas Descriptivas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos cargados para calcular estadísticas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" />Estadísticas Descriptivas</CardTitle>
        <CardDescription>Estadísticas de resumen y distribuciones para datos de defectos, enfocándose en costos de reparación y atributos categóricos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Estadísticas de Costo de Reparación</h3>
          {stats ? (
            <Table>
              <TableBody>
                <TableRow><TableCell>Media</TableCell><TableCell className="text-right">${stats.mean.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Mediana</TableCell><TableCell className="text-right">${stats.median.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Moda</TableCell><TableCell className="text-right">{Array.isArray(stats.mode) ? stats.mode.map(m => typeof m === 'number' ? `$${m.toFixed(2)}` : m).join(', ') : (stats.mode !== null && typeof stats.mode === 'number' ? `$${stats.mode.toFixed(2)}` : (stats.mode ?? 'N/D'))}</TableCell></TableRow>
                <TableRow><TableCell>Desv. Estándar</TableCell><TableCell className="text-right">${stats.stdDev.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Varianza</TableCell><TableCell className="text-right">${stats.variance.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Mín</TableCell><TableCell className="text-right">${stats.min.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Máx</TableCell><TableCell className="text-right">${stats.max.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Rango</TableCell><TableCell className="text-right">${stats.range.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Q1 (Percentil 25)</TableCell><TableCell className="text-right">${stats.q1.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Q3 (Percentil 75)</TableCell><TableCell className="text-right">${stats.q3.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>IQR</TableCell><TableCell className="text-right">${stats.iqr.toFixed(2)}</TableCell></TableRow>
              </TableBody>
            </Table>
          ) : <p>No hay datos de costos de reparación disponibles.</p>}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Distribución de Costos de Reparación (Histograma)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bin" angle={-30} textAnchor="end" height={70} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}/>
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--primary), 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Frecuencia" />
              </BarChart>
            </ResponsiveContainer>
          </div>
           <p className="text-xs text-muted-foreground text-center mt-2">
             Este histograma muestra la frecuencia de los costos de reparación agrupados en diferentes rangos (bins). Cada barra representa un rango de costos y su altura indica cuántos defectos cayeron dentro de ese rango.
           </p>
           <p className="text-xs text-muted-foreground text-center mt-1">Nota: La visualización de diagrama de caja para el Costo de Reparación se representa numéricamente (Q1, Mediana, Q3, Mín, Máx) arriba.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FrequencyChart 
            title="Tipos de Defecto" 
            data={formatFrequencyDataForChart(defectTypeFreq)} 
            icon={<ListChecks className="mr-2 h-5 w-5 text-accent" />}
            explanation="Este gráfico de barras muestra los tipos de defectos más comunes encontrados en los datos, ordenados por su frecuencia de aparición (los 10 principales)."
          />
          <FrequencyChart 
            title="Niveles de Severidad" 
            data={formatFrequencyDataForChart(severityFreq)} 
            icon={<LPieChart className="mr-2 h-5 w-5 text-accent" />}
            explanation="Este gráfico de barras muestra la distribución de los defectos según su nivel de severidad, indicando cuántos defectos corresponden a cada categoría de severidad (los 10 principales)."
          />
          <FrequencyChart 
            title="Ubicaciones de Defectos" 
            data={formatFrequencyDataForChart(locationFreq)} 
            icon={<LLineChart className="mr-2 h-5 w-5 text-accent" />}
            explanation="Este gráfico de barras visualiza las ubicaciones donde los defectos ocurren con mayor frecuencia, ayudando a identificar áreas problemáticas (las 10 principales)."
          />
          <FrequencyChart 
            title="Métodos de Inspección" 
            data={formatFrequencyDataForChart(inspectionFreq)} 
            icon={<LBarChart className="mr-2 h-5 w-5 text-accent" />}
            explanation="Este gráfico de barras indica la frecuencia con la que se utilizó cada método de inspección o la cantidad de defectos detectados por cada método (los 10 principales)."
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FrequencyChartProps {
  title: string;
  data: { name: string; count: number }[];
  icon?: React.ReactNode;
  explanation?: string;
}

function FrequencyChart({ title, data, icon, explanation }: FrequencyChartProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
        {icon}{title} (Top 10)
      </h3>
      {data.length > 0 ? (
        <>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, width: 95 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent), 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" name="Frecuencia" barSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {explanation && <p className="text-xs text-muted-foreground mt-2">{explanation}</p>}
        </>
      ) : <p className="text-muted-foreground text-sm">No hay datos para {title}.</p>}
    </div>
  );
}

