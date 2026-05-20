
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Utensils, 
  BookOpen, 
  ChevronRight, 
  Star,
  ShieldCheck,
  Users,
  Search,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function LandingPage() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", () => onSelect(api));
    api.on("reInit", () => onSelect(api));
  }, [api, onSelect]);

  const developersChoiceQuery = useMemo(() => {
    if (!firestore) return null;
    // Limit to 5 dishes as per requirements
    return query(collection(firestore, 'developersChoice'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);

  const { data: firestoreChoices } = useCollection(developersChoiceQuery);

  const dishes = useMemo(() => {
    // If admin has provided choices, use those, otherwise fallback to placeholders
    if (firestoreChoices && firestoreChoices.length > 0) {
      return firestoreChoices;
    }
    return PlaceHolderImages;
  }, [firestoreChoices]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden scroll-smooth">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10" />
      
      <nav className="container mx-auto px-4 sm:px-6 py-6 md:py-8 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-primary rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/30">
            <ChefHat className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tighter text-primary">Cooking Ina</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-all hover:scale-105">Features</Link>
          <Link href="#recipes" className="hover:text-primary transition-all hover:scale-105">Recipes</Link>
          <Link href="#community" className="hover:text-primary transition-all hover:scale-105">Community</Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {!user ? (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="rounded-xl hover:text-primary hover:bg-primary/5 transition-all text-primary">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-white px-4 md:px-6 rounded-xl shadow-lg shadow-primary/20 transition-all text-sm">Get Started</Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-white px-4 md:px-6 rounded-xl shadow-lg shadow-primary/20 transition-all text-sm">Dashboard</Button>
            </Link>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10 space-y-24 md:space-y-32">
        <section className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6 md:space-y-8 max-w-xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-accent/20">
              AI-Powered Culinary Magic
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground">
              Make your ingredients at home <span className="text-primary italic">delicious</span>, with Cooking Ina
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Stop wondering what to cook. Tell Cooking Ina what you have, and let our AI engine craft the perfect recipe tailored for your ingredients.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <Link href={user ? "/dashboard" : "/login"}>
                <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 gap-2 text-base md:text-lg transition-all hover:scale-105 hover:-translate-y-1 active:scale-95">
                  Start Cooking <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[40px] blur-2xl -z-10 animate-pulse" />
            
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
                  <Star className="w-5 h-5 fill-primary" />
                  Developer's Choice
                </h2>
              </div>

              <div id="recipes" className="perspective-1000 w-full overflow-hidden">
                <Carousel 
                  setApi={setApi}
                  opts={{
                    align: "center",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 10000,
                      stopOnInteraction: false,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {dishes.map((dish: any, index: number) => {
                      const total = dishes.length;
                      let diff = index - selectedIndex;
                      if (diff > total / 2) diff -= total;
                      if (diff < -total / 2) diff += total;

                      let rotation = 0;
                      if (diff === 0) rotation = 0;
                      else if (diff > 0) rotation = -15;
                      else rotation = 15;

                      return (
                        <CarouselItem key={dish.id || index} className="pl-2 md:pl-4 basis-[90%] sm:basis-3/4 md:basis-1/2">
                          <div 
                            className="relative group transition-all duration-700 ease-in-out transform-style-3d"
                            style={{
                              transform: `perspective(1200px) rotateY(${rotation}deg) scale(${rotation === 0 ? 1 : 0.95})`,
                              zIndex: rotation === 0 ? 30 : 10
                            }}
                          >
                            <div className="glass rounded-[32px] md:rounded-[40px] p-0 shadow-2xl relative overflow-hidden h-[400px] md:h-[500px] border-white/40">
                              <img 
                                src={dish.imageUrl} 
                                alt={dish.description} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                data-ai-hint={dish.imageHint || dish.description}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                              
                              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
                                <div className="glass p-4 md:p-5 rounded-[20px] md:rounded-[24px] border-white/30 backdrop-blur-2xl shadow-xl">
                                  <div className="flex items-center justify-between mb-2 md:mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-primary rounded-lg text-white">
                                        <Utensils className="w-3 h-3 md:w-4 md:h-4" />
                                      </div>
                                      <span className="text-[9px] md:text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Featured Dish</span>
                                    </div>
                                  </div>
                                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1 tracking-tight">{dish.description}</h3>
                                  <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium italic">
                                    Curated by our culinary experts.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <div className="flex justify-center gap-3 md:gap-4 mt-8 md:mt-12">
                    <CarouselPrevious className="static translate-y-0 h-10 w-10 md:h-14 md:w-14 glass hover:bg-white border-primary/20 rounded-xl md:rounded-2xl transition-all hover:scale-110 active:scale-95 text-primary" />
                    <CarouselNext className="static translate-y-0 h-10 w-10 md:h-14 md:w-14 glass hover:bg-white border-primary/20 rounded-xl md:rounded-2xl transition-all hover:scale-110 active:scale-95 text-primary" />
                  </div>
                </Carousel>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-12 md:space-y-16 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto space-y-3 md:space-y-4 px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Everything you need to master your kitchen</h2>
            <p className="text-muted-foreground text-base md:text-lg">Powerful features designed to make every meal special, even with the simplest ingredients.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 sm:px-0">
            {[
              { icon: Utensils, title: "Smart Pantry Tracker", desc: "Never forget what's in your fridge. Our intelligent tracker keeps your inventory up-to-date." },
              { icon: BookOpen, title: "AI Recipe Generation", desc: "Get personalized recipe suggestions based precisely on the ingredients you currently have." },
              { icon: BookOpen, title: "Personal Recipe Vault", desc: "Save your favorite AI creations and build your own digital cookbook." },
              { icon: Search, title: "Ingredient Substitutions", desc: "Missing something? Our AI suggests the best substitutes so you don't have to go to the store." },
              { icon: ShieldCheck, title: "Verified Instructions", desc: "Each recipe comes with clear, easy-to-follow steps verified for culinary excellence." },
              { icon: Users, title: "Community Sharing", desc: "See what other chefs are cooking and get inspired by trending dish combinations." }
            ].map((feature, i) => (
              <div key={i} className="glass p-6 md:p-8 rounded-3xl border-white/40 hover:translate-y-[-8px] transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary w-fit mb-5 md:mb-6">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="community" className="py-12 md:py-20 px-4 sm:px-0">
          <div className="glass rounded-[32px] md:rounded-[48px] p-8 md:p-12 lg:p-20 relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
              <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">Join a community of <span className="text-accent italic">creative</span> home chefs.</h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Cooking Ina isn't just an app—it's a movement of people making the most out of every ingredient. Share tips, discover flavors, and cook like a pro.
                </p>
                <div className="flex justify-center lg:justify-start gap-4">
                   <Link href="/login">
                    <Button size="lg" className="rounded-2xl h-12 md:h-14 px-6 md:px-8 bg-primary hover:bg-primary/90">Join the Movement</Button>
                   </Link>
                </div>
              </div>
              
              <div className="relative flex flex-col items-center justify-center p-8 md:p-12 bg-white/40 rounded-[32px] md:rounded-[40px] border border-white/60 shadow-xl overflow-hidden group">
                <div className="absolute -top-4 -left-4 p-4 bg-primary/10 rounded-full text-primary/20 group-hover:scale-110 transition-transform">
                  <Quote className="w-10 h-10 md:w-12 md:h-12" />
                </div>
                <div className="relative z-10 text-center space-y-4 md:space-y-6">
                  <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary leading-tight italic">
                    "Anyone can cook."
                  </blockquote>
                  <div className="h-0.5 w-10 md:w-12 bg-accent mx-auto rounded-full" />
                  <cite className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground not-italic">
                    — Chef Auguste Gusteau
                  </cite>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 md:px-6 py-12 text-center text-xs md:text-sm text-muted-foreground border-t border-primary/10">
        <p>&copy; {currentYear ?? '...'} Cooking Ina. Crafted with precision and passion.</p>
      </footer>
    </div>
  );
}
