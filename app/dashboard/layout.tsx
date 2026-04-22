import AppNav from '@/components/AppNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppNav />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
