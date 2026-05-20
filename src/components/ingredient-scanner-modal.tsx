"use client"

import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, Scan, Check, Plus } from 'lucide-react';
import { scanIngredients } from '@/ai/flows/scan-ingredients-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface IngredientScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientsFound: (ingredients: string[]) => void;
}

export function IngredientScannerModal({ isOpen, onClose, onIngredientsFound }: IngredientScannerModalProps) {
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [foundIngredients, setFoundIngredients] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setFoundIngredients([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!previewImage) return;

    setIsScanning(true);
    try {
      const result = await scanIngredients({ photoDataUri: previewImage });
      setFoundIngredients(result.ingredients);
      toast({
        title: "Scan Complete!",
        description: `Andrew's Pan identified ${result.ingredients.length} ingredients.`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not identify ingredients. Please try a clearer photo.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddAll = () => {
    onIngredientsFound(foundIngredients);
    toast({
      title: "Pantry Updated",
      description: "Ingredients have been added to your inventory.",
    });
    setPreviewImage(null);
    setFoundIngredients([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass border-white/40 shadow-2xl rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Scan className="w-6 h-6" />
            Ingredient Scanner
          </DialogTitle>
          <DialogDescription>
            Snap a photo of your fridge or counter, and I'll identify the ingredients for you!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="relative h-64 w-full border-2 border-dashed border-primary/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-12 h-12 text-primary/30 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Click to capture ingredients</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          {foundIngredients.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Identified Items:</h4>
              <div className="flex flex-wrap gap-2">
                {foundIngredients.map((ing, i) => (
                  <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    {ing}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          {!foundIngredients.length ? (
            <Button 
              onClick={handleScan} 
              disabled={!previewImage || isScanning}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  Identify Ingredients
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleAddAll}
              className="w-full rounded-xl bg-accent hover:bg-accent/90 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Pantry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
