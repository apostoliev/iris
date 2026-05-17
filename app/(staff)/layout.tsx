import Link from 'next/link';
import { IrisWordmark } from '@/components/iris/Marks';
import { SmallCaps } from '@/components/iris/SmallCaps';

export const dynamic = 'force-dynamic';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header
        className="bg-paper/80 backdrop-blur-sm sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(31, 74, 58, 0.14)' }}
      >
        <div className="mx-auto max-w-6xl px-7 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-baseline gap-3 group">
            <IrisWordmark size={26} />
            <span style={{ color: 'rgba(31, 74, 58, 0.32)' }}>·</span>
            <SmallCaps size={10} tracking={0.30} color="#1F4A3A">
              Rosewood · Sand Hill
            </SmallCaps>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer
        className="py-5 text-center"
        style={{ borderTop: '1px solid rgba(31, 74, 58, 0.14)' }}
      >
        <SmallCaps size={9.5} tracking={0.30} color="#5C7368">
          Demo mode · Iris carries
        </SmallCaps>
      </footer>
    </div>
  );
}
