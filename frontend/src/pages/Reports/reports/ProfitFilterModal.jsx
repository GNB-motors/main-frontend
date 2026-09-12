// Profit-range filter dialog for TripLedgerReport. Extracted (WS0.7); markup preserved.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ProfitFilterModal({
  isOpen,
  onClose,
  localProfit,
  onLocalProfitChange,
  minProfit,
  maxProfit,
  safeSliderMin,
  safeSliderMax,
  onLocalSliderChange,
  onApply,
  onReset,
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Filter by Profit</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 px-6 py-4 overflow-x-hidden">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <Label htmlFor="min-profit">Min Profit (₹)</Label>
              <Input
                id="min-profit"
                type="number"
                value={localProfit[0]}
                onChange={(e) => onLocalProfitChange([e.target.value, localProfit[1]])}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <Label htmlFor="max-profit">Max Profit (₹)</Label>
              <Input
                id="max-profit"
                type="number"
                value={localProfit[1]}
                onChange={(e) => onLocalProfitChange([localProfit[0], e.target.value])}
              />
            </div>
          </div>
          <div className="px-2">
            <Label className="text-xs text-muted-foreground">Range Selector</Label>
            <Slider
              value={[safeSliderMin, safeSliderMax]}
              onValueChange={onLocalSliderChange}
              min={minProfit}
              max={maxProfit}
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-destructive hover:text-destructive"
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onApply}>Apply Filter</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
