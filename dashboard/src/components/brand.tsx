import Image from 'next/image';
import Link from 'next/link';

/** Logotip + so'z belgisi. */
export function Logo({ href = '/', size = 32 }: { href?: string; size?: number }) {
  return (
    <Link className="group inline-flex items-center gap-2.5" href={href}>
      <Image
        alt=""
        className="rounded-full ring-1 ring-white/10 transition-transform group-hover:scale-105"
        height={size}
        priority
        src="/brand/logo.png"
        width={size}
      />
      <span className="font-display text-[15px] font-semibold tracking-tight text-white">
        Uz<span className="text-brand-light">Cord</span>
      </span>
    </Link>
  );
}

/** Bayroq polosasi — brendning asosiy ajratuvchi belgisi. */
export function Tricolor({ className = 'h-[3px] w-full' }: { className?: string }) {
  return <div aria-hidden="true" className={`tricolor ${className}`} />;
}
