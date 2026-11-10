import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UploadPhotosDialog from './UploadPhotosDialog';
import DriverChartDialog from './DriverChartDialog';

/**
 * The photo side of the imports page: pile in the paper trail, then decide who
 * was driving. One flow, one piece of state — which panel is open and which
 * batch it belongs to.
 */
export default function PhotoImportPanel() {
  const [flow, setFlow] = useState({
    uploadOpen: false,
    chartOpen: false,
    chartBatchId: '',
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload a pile of register pages, fuel slips, pump displays, bills, odometer photos and
            driver documents. We read them, tell you which ones to retake, and chart who was
            driving.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setFlow((prev) => ({ ...prev, uploadOpen: true }))}>
              <Camera className="h-4 w-4" /> Upload photos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFlow((prev) => ({ ...prev, chartOpen: true }))}
            >
              Driver predictions
            </Button>
          </div>
        </CardContent>
      </Card>

      <UploadPhotosDialog
        open={flow.uploadOpen}
        onOpenChange={(open) => setFlow((prev) => ({ ...prev, uploadOpen: open }))}
        onBatchReady={(id) => setFlow((prev) => ({ ...prev, chartBatchId: id }))}
        onOpenChart={(id) =>
          setFlow((prev) => ({
            ...prev,
            uploadOpen: false,
            chartOpen: true,
            chartBatchId: id,
          }))
        }
      />
      <DriverChartDialog
        open={flow.chartOpen}
        batchId={flow.chartBatchId}
        onOpenChange={(open) => setFlow((prev) => ({ ...prev, chartOpen: open }))}
      />
    </>
  );
}
