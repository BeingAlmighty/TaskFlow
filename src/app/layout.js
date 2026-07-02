import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TaskFlow | Enterprise Task Management',
  description: 'Streamline your team\'s productivity with TaskFlow. The ultimate enterprise solution for managing tasks, tracking progress, and boosting collaboration across organizations.',
  keywords: 'Task Management, Enterprise, Productivity, Team Collaboration, TaskFlow',
  authors: [{ name: 'TaskFlow Inc.' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
