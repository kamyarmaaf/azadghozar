import { AppShell } from '@/components/AppShell';

export default function CatchAllPage() {
  return <AppShell />;
}

export function generateStaticParams() {
  return [{ path: ['__spa-fallback__'] }];
}
