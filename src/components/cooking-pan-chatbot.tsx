
"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, MessageCircle, ChefHat, Loader2, GripVertical, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { culinaryChat } from '@/ai/flows/culinary-chatbot-flow';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function CookingPanChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Hi! I'm Andrew's Pan! Need a hand (or a handle) in the kitchen? Ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Announcement State
  const firestore = useFirestore();
  const announcementQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'announcements'),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
  }, [firestore]);
  
  const { data: announcements } = useCollection(announcementQuery);
  const latestAnnouncement = announcements?.[0];
  const [showAnnouncementBubble, setShowAnnouncementBubble] = useState(false);

  useEffect(() => {
    if (latestAnnouncement) {
      setShowAnnouncementBubble(true);
      const timer = setTimeout(() => setShowAnnouncementBubble(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [latestAnnouncement]);

  // Draggable State
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const newX = window.innerWidth - clientX - (dragRef.current?.offsetWidth || 0) + offset.current.x;
      const newY = window.innerHeight - clientY - (dragRef.current?.offsetHeight || 0) + offset.current.y;
      
      // Keep within bounds
      setPosition({ 
        x: Math.max(10, Math.min(window.innerWidth - 80, newX)), 
        y: Math.max(10, Math.min(window.innerHeight - 80, newY)) 
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      // Prevent scrolling while dragging
      if (isDragging) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const result = await culinaryChat({ 
        message: userMsg,
        history: messages.filter(m => !m.content.startsWith('📢')) 
      });
      setMessages(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Oops! My handle got stuck. Can you try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAnnouncement = () => {
    if (latestAnnouncement) {
      setMessages(prev => [...prev, { role: 'model', content: `📢 IMPORTANT ANNOUNCEMENT: ${latestAnnouncement.message}` }]);
      setIsOpen(true);
      setShowAnnouncementBubble(false);
    }
  };

  if (isHidden) return null;

  const PanIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
      <path d="M4 11C4 11 4 17 10 17C16 17 16 11 16 11H4Z" fill="#14856E" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M16 13H21C21.5523 13 22 13.4477 22 14C22 14.5523 21.5523 15 21 15H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8" cy="13" r="1" fill="white"/>
      <circle cx="12" cy="13" r="1" fill="white"/>
      <path d="M9 15C9 15 10 16 11 15" stroke="white" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div 
      ref={dragRef}
      className="fixed z-[100] transition-transform duration-200"
      style={{ right: position.x, bottom: position.y }}
    >
      {!isOpen ? (
        <div 
          className={cn(
            "group relative cursor-pointer active:cursor-grabbing touch-none",
            isDragging && "scale-110 rotate-12"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={() => !isDragging && setIsOpen(true)}
        >
          {showAnnouncementBubble && (
            <div 
              className="absolute -top-20 -right-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAnnouncement();
              }}
            >
              <div className="bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3">
                <Bell className="w-5 h-5 animate-bounce" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-tighter">New Admin Announcement!</span>
                  <span className="text-[10px] opacity-80">Click to read more</span>
                </div>
                <div className="absolute -bottom-2 right-10 w-4 h-4 bg-accent border-r-2 border-b-2 border-white rotate-45" />
              </div>
            </div>
          )}

          {!showAnnouncementBubble && (
            <div className="absolute -top-16 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border-2 border-primary/10 relative">
                <span className="text-xs font-bold text-primary whitespace-nowrap">Need a chef's hand?</span>
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/10 rotate-45" />
              </div>
            </div>
          )}

          <div className={cn(
            "bg-primary p-4 rounded-full shadow-2xl transition-all border-4 border-white animate-bounce group-hover:animate-none group-hover:scale-110",
            isDragging && "animate-none scale-110"
          )}>
            <PanIcon />
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <Card className="w-80 md:w-96 glass-dark border-2 border-white/50 shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in duration-300">
          <CardHeader className="p-4 bg-primary text-white flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-white/20 rounded-lg">
                <PanIcon />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Andrew's Pan</CardTitle>
                <p className="text-[10px] opacity-80">Sizzling & Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white h-8 w-8 hover:bg-white/10" 
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72 p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                      m.role === 'user' ? "bg-primary text-white" : "bg-white text-foreground shadow-sm"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] italic">Checking the ingredients...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 bg-white/50 border-t flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Ask Andrew's Pan..." 
                className="rounded-xl h-10 text-xs border-primary/20 bg-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={handleSend} disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <button 
              onClick={() => setIsHidden(true)}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mx-auto"
            >
              <Info className="w-3 h-3" /> Hide Assistant
            </button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
