'use client';

import { NotFoundCard, T } from 'components';
import { useUIStore } from 'hooks';

export function MermaidNotFoundCard() {
  const { Link } = useUIStore((store) => store.components);
  return (
    <NotFoundCard title="mermaid not found" description="the mermaid does not exist or you do not have permissions to view it">
      <Link href="/">
        <T className="tt-se fw-bd">go home</T>
      </Link>
    </NotFoundCard>
  );
}
