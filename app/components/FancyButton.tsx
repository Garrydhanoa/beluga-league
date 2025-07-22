import Link from 'next/link';
import React, { ReactNode } from 'react';

type FancyButtonProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}

export default function FancyButton({ href, children, external = false, className = '' }: FancyButtonProps) {
  const buttonClass = `fancy-button ${className}`;
  
  if (external) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={buttonClass}>
      {children}
    </Link>
  );
}