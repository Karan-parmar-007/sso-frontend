export function KeyMark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 18"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="9" r="5.2" strokeWidth="1.6" />
      <circle cx="7" cy="9" r="1.6" strokeWidth="1.3" />
      <path d="M12.2 9 H25" strokeWidth="1.6" />
      <path d="M19 9 V14" strokeWidth="1.6" />
      <path d="M23 9 V13" strokeWidth="1.6" />
    </svg>
  )
}

export function DoodleHouse({ className = 'w-16 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 64"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M10 30 L36 12 L62 30"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M18 28.5 V52 H54 V28.5"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M32 52 V40 H42 V52" strokeWidth="1.8" />
      <circle cx="50" cy="22" r="2" fill="var(--terracotta)" stroke="none" />
    </svg>
  )
}

export function DoodleBook({ className = 'w-16 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 64"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 18 C12 18 24 12 36 20 C48 12 60 18 60 18 V48 C60 48 48 42 36 50 C24 42 12 48 12 18 Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M36 20 V50" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 26 H30" stroke="var(--forest)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 32 H29" stroke="var(--pencil)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 26 H52" stroke="var(--forest)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M42 32 H50" stroke="var(--pencil)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function DoodleWave({ className = 'w-16 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 64"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M8 40 Q16 24 24 40 T40 40 T56 40 T68 34"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="36" cy="18" r="4.5" stroke="var(--forest)" strokeWidth="1.8" />
      <path d="M36 22.5 V30" stroke="var(--forest)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function DoodleCheck({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5 L9.5 18 L20 6.5" strokeWidth="2.2" />
    </svg>
  )
}
