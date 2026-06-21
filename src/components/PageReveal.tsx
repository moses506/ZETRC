import { CSSProperties, ReactNode } from 'react';

type PageRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function PageReveal({ children, className = '', style }: PageRevealProps) {
  return (
    <div className={`page-reveal ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

type RevealItemProps = {
  children: ReactNode;
  index?: number;
  variant?: 'up' | 'scale';
  className?: string;
  style?: CSSProperties;
};

export function RevealItem({
  children,
  index = 0,
  variant = 'up',
  className = '',
  style,
}: RevealItemProps) {
  const variantClass = variant === 'scale' ? 'reveal-item-scale' : 'reveal-item';

  return (
    <div
      className={`${variantClass} ${className}`.trim()}
      style={{ ...style, '--reveal-index': index } as CSSProperties}
    >
      {children}
    </div>
  );
}
