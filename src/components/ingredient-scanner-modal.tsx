
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, Scan, Check, Plus, X, Video } from 'lucide-react';
import { scanIngredients } from '@/ai/flows/scan-ingredients-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const [isLive, setIsLive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLive(false);
  };

  const startCamera = async () => {
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsLive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setPermissionDenied(true);
      toast({
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser to scan live.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setFoundIngredients([]);
        stopCamera();
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

  const resetScanner = () => {
    setPreviewImage(null);
    setFoundIngredients([]);
    stopCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetScanner();
      }
    }}>
      <DialogContent className="sm:max-w-md glass border-white/40 shadow-2xl rounded-[32px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Scan className="w-6 h-6" />
            Ingredient Scanner
          </DialogTitle>
          <DialogDescription>
            Snap a photo or upload an image, and I'll identify the ingredients for you!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative h-72 w-full border-2 border-dashed border-primary/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-primary/5 transition-all">
            {isLive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    onClick={capturePhoto} 
                    className="rounded-full h-14 w-14 bg-white hover:bg-white/90 border-4 border-primary shadow-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-white bg-black/20 hover:bg-black/40 rounded-full"
                  onClick={stopCamera}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : previewImage ? (
              <div className="relative w-full h-full">
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg"
                  onClick={() => setPreviewImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full p-6">
                <Button 
                  onClick={startCamera}
                  className="w-full h-16 rounded-2xl bg-primary text-white gap-3 text-lg font-bold shadow-lg shadow-primary/20"
                >
                  <Camera className="w-6 h-6" />
                  Live Camera
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-primary/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-14 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 gap-3"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload from Gallery
                </Button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <canvas ref={canvasRef} className="hidden" />
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
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 h-12 font-bold"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Andrew's Pan is analyzing...
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
              className="w-full rounded-xl bg-accent hover:bg-accent/90 text-white gap-2 h-12 font-bold"
            >
              <Plus className="w-4 h-4" />
              Add all to Pantry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
