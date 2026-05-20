
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
import { Textarea } from '@/components/ui/textarea';
import { Camera, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

interface DiaryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiaryUploadModal({ isOpen, onClose }: DiaryUploadModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Failed to upload image to Cloudinary');
    const data = await response.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (!user || !firestore || !selectedFile || !caption.trim()) return;

    setIsSubmitting(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(selectedFile);

      const diaryData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Chef',
        userPhoto: user.photoURL || '',
        imageUrl: cloudinaryUrl,
        caption: caption.trim(),
        createdAt: serverTimestamp()
      };

      const diaryRef = collection(firestore, 'diaryEntries');

      addDoc(diaryRef, diaryData)
        .then(() => {
          toast({
            title: "Memory Saved!",
            description: "Your culinary creation has been shared with the community.",
          });
          setPreviewImage(null);
          setSelectedFile(null);
          setCaption('');
          onClose();
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: diaryRef.path,
            operation: 'create',
            requestResourceData: diaryData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong during the upload.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass border-white/40 shadow-2xl rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Camera className="w-6 h-6" />
            New Diary Entry
          </DialogTitle>
          <DialogDescription>
            Share your masterpiece using Cloudinary for high-quality storage.
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
                <ImageIcon className="w-12 h-12 text-primary/30 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Click to select a photo</p>
                <p className="text-[10px] text-muted-foreground/60">Upload via Cloudinary</p>
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

          <div className="space-y-2">
            <Textarea
              placeholder="Tell us about this dish..."
              className="min-h-[100px] rounded-xl bg-white/50 focus:bg-white border-primary/10"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !caption.trim() || isSubmitting}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Share to Diary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
