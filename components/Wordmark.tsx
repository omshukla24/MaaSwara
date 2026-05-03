// =============================================================================
// MaaSwara — Wordmark Component
// "Maa" in deep emerald, "Swara" in terracotta — Fraunces 600
// =============================================================================

'use client';

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl md:text-6xl',
};

export default function Wordmark({
  size = 'lg',
  showTagline = true,
  className = '',
}: WordmarkProps) {
  return (
    <div className={`${className}`}>
      <h1
        className={`font-display font-semibold tracking-tight ${sizeClasses[size]}`}
      >
        <span style={{ color: 'var(--emerald)' }}>Maa</span>
        <span style={{ color: 'var(--terracotta)' }}>Swara</span>
      </h1>
      {showTagline && (
        <p
          className="mt-2 font-display italic text-base md:text-lg"
          style={{ color: 'var(--ink-soft)' }}
        >
          A mother&apos;s voice, in her own voice.
        </p>
      )}
    </div>
  );
}
