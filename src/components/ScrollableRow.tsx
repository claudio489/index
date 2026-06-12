interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
}

export default function ScrollableRow({ children, className = '' }: ScrollableRowProps) {
  return (
    <div
      className={`flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pl-4 pr-4 pb-1 ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}
