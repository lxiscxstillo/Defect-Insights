"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DefectRecord } from '@/types';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


interface DataImportCardProps {
  onDataLoaded: (data: DefectRecord[]) => void;
}

// Basic CSV parser - assumes simple structure, no commas within quoted fields.
// For production, a robust library like PapaParse is recommended.
function parseCSV(csvText: string): { records: DefectRecord[], error?: string } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { records: [], error: "El CSV debe tener un encabezado y al menos una fila de datos." };

  const headerLine = lines[0];
  const dataLines = lines.slice(1);

  const getHeaderIndex = (headers: string[], name: string, altNames: string[] = []): number => {
    let index = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
    if (index === -1) {
      for (const altName of altNames) {
        index = headers.findIndex(h => h.trim().toLowerCase() === altName.toLowerCase());
        if (index !== -1) break;
      }
    }
    return index;
  };
  
  const headers = headerLine.split(',').map(h => h.trim());
  
  const defectTypeIndex = getHeaderIndex(headers, "Tipo de Defecto", ["defect_type", "defect type"]);
  const severityIndex = getHeaderIndex(headers, "Severidad", ["severity"]);
  const defectLocationIndex = getHeaderIndex(headers, "Ubicación", ["defect_location", "location"]);
  const inspectionMethodIndex = getHeaderIndex(headers, "Método de Inspección", ["inspection_method", "inspection method"]);
  const repairCostIndex = getHeaderIndex(headers, "Costo de Reparación ($)", ["repair_cost", "repair cost"]);

  const requiredHeaderMappings = {
    "Tipo de Defecto": defectTypeIndex,
    "Severidad": severityIndex,
    "Ubicación": defectLocationIndex,
    "Método de Inspección": inspectionMethodIndex,
    "Costo de Reparación ($)": repairCostIndex,
  };

  const missingHeaders = Object.entries(requiredHeaderMappings)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);

  if (missingHeaders.length > 0) {
    return { records: [], error: `Faltan encabezados CSV requeridos: ${missingHeaders.join(', ')}. Asegúrese de que su CSV tenga las columnas: "Tipo de Defecto", "Severidad", "Ubicación", "Método de Inspección", "Costo de Reparación ($)".` };
  }

  const records: DefectRecord[] = [];
  const parseErrors: string[] = [];

  dataLines.forEach((line, index) => {
    const values = line.split(',');
    if (values.length === headers.length) {
      try {
        const repairCostString = values[repairCostIndex].trim();
        const repairCost = parseFloat(repairCostString);

        if (isNaN(repairCost)) {
          parseErrors.push(`Fila ${index + 2}: Valor de costo de reparación inválido '${repairCostString}'.`);
          return; 
        }

        const record: DefectRecord = {
          id: `record_${index}`,
          defect_type: values[defectTypeIndex].trim(),
          severity: values[severityIndex].trim(),
          defect_location: values[defectLocationIndex].trim(),
          inspection_method: values[inspectionMethodIndex].trim(),
          repair_cost: repairCost,
        };
        records.push(record);
      } catch (e) {
        parseErrors.push(`Fila ${index + 2}: Error al analizar los datos.`);
      }
    } else {
       parseErrors.push(`Fila ${index + 2}: Número incorrecto de columnas. Se esperaban ${headers.length}, se obtuvieron ${values.length}.`);
    }
  });

  if (parseErrors.length > 0 && records.length === 0) { // If all rows failed and no records parsed
    return { records: [], error: `No se pudieron analizar filas de datos. Primer error: ${parseErrors[0]}` };
  }
  if (parseErrors.length > 0 && records.length > 0) { // Some rows parsed, some failed
     return { records, error: `Se analizaron ${records.length} registros correctamente, pero ${parseErrors.length} filas tuvieron errores. Primer error: ${parseErrors[0]}` };
  }

  return { records };
}


export default function DataImportCard({ onDataLoaded }: DataImportCardProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<DefectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { records, error } = parseCSV(text);
        if (error && records.length === 0) {
          toast({
            variant: "destructive",
            title: "Error de Análisis CSV",
            description: error,
          });
          setImportedData([]);
          onDataLoaded([]);
        } else {
          if (error && records.length > 0) {
             toast({
              variant: "default", // Use default for partial success
              title: "Análisis CSV Parcial",
              description: error,
            });
          } else if (records.length > 0) {
             toast({
              title: "Datos Cargados",
              description: `${records.length} registros importados correctamente desde ${file.name}.`,
            });
          } else {
             toast({
              variant: "destructive",
              title: "No se Analizaron Datos",
              description: "No se encontraron registros válidos en el archivo CSV.",
            });
          }
          setImportedData(records);
          onDataLoaded(records);
        }
        setIsLoading(false);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error de Lectura de Archivo",
          description: "No se pudo leer el archivo seleccionado.",
        });
        setIsLoading(false);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          Importar Datos de Defectos (CSV)
        </CardTitle>
        <CardDescription>
          Cargue sus datos de defectos de fabricación en formato CSV. Asegúrese de que los encabezados sean: Tipo de Defecto, Severidad, Ubicación, Método de Inspección, Costo de Reparación ($).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isLoading}
          />
          {fileName && <p className="text-sm text-muted-foreground mt-2">Cargado: {fileName}</p>}
        </div>
        {isLoading && <p>Cargando y analizando datos...</p>}
        
        {!isLoading && importedData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p>No hay datos cargados todavía. Por favor, cargue un archivo CSV.</p>
            <p className="text-xs mt-1">El analizador es básico y espera valores separados por comas sin comas dentro de campos entrecomillados.</p>
          </div>
        )}

        {!isLoading && importedData.length > 0 && (
          <ScrollArea className="h-[300px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Defecto</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Inspección</TableHead>
                  <TableHead className="text-right">Costo de Reparación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedData.slice(0, 100).map((defect) => ( // Display up to 100 rows for performance
                  <TableRow key={defect.id}>
                    <TableCell>{defect.defect_type}</TableCell>
                    <TableCell>{defect.severity}</TableCell>
                    <TableCell>{defect.defect_location}</TableCell>
                    <TableCell>{defect.inspection_method}</TableCell>
                    <TableCell className="text-right">${defect.repair_cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {importedData.length > 100 && <p className="text-sm text-muted-foreground p-2">Mostrando los primeros 100 registros. Registros totales: {importedData.length}</p>}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
