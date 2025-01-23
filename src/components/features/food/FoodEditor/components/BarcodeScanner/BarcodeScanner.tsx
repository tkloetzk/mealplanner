import React from "react";
import { Result, useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (upc: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const handleScan = (result: Result) => {
    setScanning(false);
    onScan(result.getText());
  };

  const { ref } = useZxing({
    onDecodeResult: handleScan,
    onError: (error) => {
      setError(error.message);
    },
    paused: !scanning || retrying,
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Scan Barcode</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <video ref={ref} className="w-full aspect-square object-cover" />
      </div>
    </div>
  );
}
