import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X, Eye, ZoomIn, ZoomOut } from "lucide-react";

export function OriginalPdfViewerModal({
  file,
  isOpen,
  onClose,
}: {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  if (!file) return null;
  const pdfUrl = URL.createObjectURL(file);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 bg-card">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-primary truncate max-w-[400px]">
            <Eye className="w-4 h-4 text-amber-500" />
            <span>{file.name}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = file.name;
                a.click();
              }}
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs gap-1 bg-royal-gradient text-white"
              onClick={() => {
                const w = window.open(pdfUrl, "_blank");
                w?.print();
              }}
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Cadre d'affichage PDF original fidèle à 100% */}
        <div className="flex-1 w-full h-full overflow-hidden rounded-lg border bg-slate-900 mt-2">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
            aria-label="Afficheur PDF original BERSA"
          >
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="Afficheur PDF Original"
            >
              <p className="p-4 text-white text-xs">
                Votre navigateur ne peut pas afficher ce PDF directement.{" "}
                <a href={pdfUrl} download={file.name} className="underline text-amber-400">
                  Cliquez ici pour le télécharger.
                </a>
              </p>
            </iframe>
          </object>
        </div>
      </DialogContent>
    </Dialog>
  );
}
  
