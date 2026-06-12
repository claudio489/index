import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkLabel?: string;
}

export default function SectionHeader({ title, linkTo, linkLabel = 'Ver todos' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-0.5 text-sm text-padi-blue hover:text-padi-blue-light transition-colors"
        >
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
