import Image from 'next/image';

export function FluxerLogo({ className = 'h-7 w-7' }: { className?: string }): React.ReactElement {
  return (
    <Image
      src="/logo.svg"
      alt="Fluxer"
      width={64}
      height={64}
      className={className}
      unoptimized
      priority
    />
  );
}
