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
  if (lines.length < 2) return { records: [], error: "CSV must have a header and at least one data row." };

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
  
  const defectTypeIndex = getHeaderIndex(headers, "Defect Type", ["defect_type"]);
  const severityIndex = getHeaderIndex(headers, "Severity", ["severity"]);
  const defectLocationIndex = getHeaderIndex(headers, "Location", ["defect_location"]);
  const inspectionMethodIndex = getHeaderIndex(headers, "Inspection Method", ["inspection_method"]);
  const repairCostIndex = getHeaderIndex(headers, "Repair Cost ($)", ["repair_cost", "repair cost"]);

  const requiredHeaderMappings = {
    "Defect Type": defectTypeIndex,
    "Severity": severityIndex,
    "Location": defectLocationIndex,
    "Inspection Method": inspectionMethodIndex,
    "Repair Cost ($)": repairCostIndex,
  };

  const missingHeaders = Object.entries(requiredHeaderMappings)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);

  if (missingHeaders.length > 0) {
    return { records: [], error: `Missing required CSV headers: ${missingHeaders.join(', ')}. Please ensure your CSV has columns: "Defect Type", "Severity", "Location", "Inspection Method", "Repair Cost ($)".` };
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
          parseErrors.push(`Row ${index + 2}: Invalid repair cost value '${repairCostString}'.`);
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
        parseErrors.push(`Row ${index + 2}: Error parsing data.`);
      }
    } else {
       parseErrors.push(`Row ${index + 2}: Incorrect number of columns. Expected ${headers.length}, got ${values.length}.`);
    }
  });

  if (parseErrors.length > 0 && records.length === 0) { // If all rows failed and no records parsed
    return { records: [], error: `Failed to parse any data rows. First error: ${parseErrors[0]}` };
  }
  if (parseErrors.length > 0 && records.length > 0) { // Some rows parsed, some failed
     return { records, error: `Successfully parsed ${records.length} records, but ${parseErrors.length} rows had errors. First error: ${parseErrors[0]}` };
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
            title: "CSV Parsing Error",
            description: error,
          });
          setImportedData([]);
          onDataLoaded([]);
        } else {
          if (error && records.length > 0) {
             toast({
              variant: "default", // Use default for partial success
              title: "Partial CSV Parse",
              description: error,
            });
          } else if (records.length > 0) {
             toast({
              title: "Data Loaded",
              description: `${records.length} records imported successfully from ${file.name}.`,
            });
          } else {
             toast({
              variant: "destructive",
              title: "No Data Parsed",
              description: "No valid records found in the CSV file.",
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
          title: "File Read Error",
          description: "Could not read the selected file.",
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
          Import Defect Data (CSV)
        </CardTitle>
        <CardDescription>
          Upload your manufacturing defect data in CSV format. Ensure headers are: Defect Type, Severity, Location, Inspection Method, Repair Cost ($).
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
          {fileName && <p className="text-sm text-muted-foreground mt-2">Loaded: {fileName}</p>}
        </div>
        {isLoading && <p>Loading and parsing data...</p>}
        
        {!isLoading && importedData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p>No data loaded yet. Please upload a CSV file.</p>
            <p className="text-xs mt-1">The parser is basic and expects comma-separated values without commas inside quoted fields.</p>
          </div>
        )}

        {!isLoading && importedData.length > 0 && (
          <ScrollArea className="h-[300px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Defect Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Inspection</TableHead>
                  <TableHead className="text-right">Repair Cost</TableHead>
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
            {importedData.length > 100 && <p className="text-sm text-muted-foreground p-2">Showing first 100 records. Total records: {importedData.length}</p>}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
