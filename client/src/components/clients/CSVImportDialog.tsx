import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle2, Download, X, Loader2, FileUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { parseCSV, generateSampleCSV, type ParseResult, type ParsedClient } from "../../../../shared/csv-parser";
import { toast } from "sonner";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: { index: number; message: string }[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const importMutation = trpc.clients.import.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setStep("complete");
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} clients`);
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setStep("preview");
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseCSV(content);
      setParseResult(result);
      setStep("preview");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleImport = () => {
    if (!parseResult || parseResult.clients.length === 0) return;
    
    setStep("importing");
    importMutation.mutate({
      clients: parseResult.clients,
      skipDuplicates,
    });
  };

  const handleDownloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setStep("upload");
    setParseResult(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your CSV file here, or
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <Button variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Need a template?</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your CSV should include columns: Name (required), Email, Company Name, Address, Phone, Notes, VAT Number
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreviewStep = () => {
    if (!parseResult) return null;

    const hasErrors = parseResult.errors.length > 0;
    const criticalErrors = parseResult.errors.filter(e => e.field === "name" || e.field === "header");

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold">{parseResult.totalRows}</div>
            <div className="text-xs text-muted-foreground">Total Rows</div>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-500">{parseResult.validRows}</div>
            <div className="text-xs text-muted-foreground">Valid</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-500">{parseResult.errors.length}</div>
            <div className="text-xs text-muted-foreground">Issues</div>
          </div>
        </div>

        {/* Errors */}
        {hasErrors && (
          <Alert variant={criticalErrors.length > 0 ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">
                {criticalErrors.length > 0 ? "Critical errors found:" : "Warnings:"}
              </div>
              <ul className="text-sm list-disc list-inside max-h-24 overflow-y-auto">
                {parseResult.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>
                    Row {error.row}: {error.message}
                    {error.value && <span className="text-muted-foreground"> ({error.value})</span>}
                  </li>
                ))}
                {parseResult.errors.length > 5 && (
                  <li className="text-muted-foreground">
                    ...and {parseResult.errors.length - 5} more
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Duplicates warning */}
        {parseResult.duplicates.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Found {parseResult.duplicates.length} duplicate email(s) in CSV file
            </AlertDescription>
          </Alert>
        )}

        {/* Preview table */}
        {parseResult.clients.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.clients.slice(0, 10).map((client, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>{client.companyName || "-"}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parseResult.clients.length > 10 && (
              <div className="p-2 text-center text-sm text-muted-foreground bg-secondary/50">
                Showing 10 of {parseResult.clients.length} clients
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="skipDuplicates"
            checked={skipDuplicates}
            onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
          />
          <Label htmlFor="skipDuplicates" className="text-sm">
            Skip clients with emails that already exist
          </Label>
        </div>
      </div>
    );
  };

  const renderImportingStep = () => (
    <div className="py-8 text-center">
      <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Importing clients...</p>
    </div>
  );

  const renderCompleteStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <div className="py-4 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-500">{importResult.imported}</div>
            <div className="text-xs text-muted-foreground">Imported</div>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-500">{importResult.skipped}</div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-500">{importResult.errors.length}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>

        {importResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="text-sm list-disc list-inside">
                {importResult.errors.map((error, i) => (
                  <li key={i}>Row {error.index + 1}: {error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <FileUp className="size-4 text-primary" />
            </div>
            {step === "upload" && "Import Clients from CSV"}
            {step === "preview" && "Preview Import"}
            {step === "importing" && "Importing..."}
            {step === "complete" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to bulk import clients"}
            {step === "preview" && "Review the data before importing"}
            {step === "importing" && "Please wait while we import your clients"}
            {step === "complete" && "Your clients have been imported"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "upload" && renderUploadStep()}
          {step === "preview" && renderPreviewStep()}
          {step === "importing" && renderImportingStep()}
          {step === "complete" && renderCompleteStep()}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          {step === "upload" && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!parseResult || parseResult.clients.length === 0}
              >
                <Upload className="size-4" />
                Import {parseResult?.clients.length || 0} Clients
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button variant="success" onClick={handleClose}>
              <CheckCircle2 className="size-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
