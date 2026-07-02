export const metadata = {
  title: 'Master Operations',
  description: 'Internal System Operations Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function MasterPortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500/30">
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
