import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CookingPanChatbot } from '@/components/cooking-pan-chatbot';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { ThemeBackground } from '@/components/theme-background';

export const metadata: Metadata = {
  title: 'Cooking Ina - Your Smart Culinary Assistant',
  description: 'An AI-powered recipe discovery and ingredient tracking platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground relative min-h-screen">
        <FirebaseClientProvider>
          <ThemeWrapper>
            <ThemeBackground />
            {children}
            <Toaster />
            <CookingPanChatbot />
          </ThemeWrapper>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
