import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

export default function FolderChooseButton({ children = 'Choose your project', className = '', ...props }: Props & ButtonHTMLAttributes<HTMLButtonElement>){
  const base = `relative inline-grid items-center w-80 h-14 cursor-pointer`;

  const topButton = `relative z-10 inline-flex items-center justify-center w-full h-full rounded-lg bg-cyan-500 text-white font-bold tracking-wide transition-transform duration-150 ease-out hover:-translate-y-1`;

  return (
    <div className={`font-extrabold ${base} ${className}`}>
  <style>{`@keyframes buzz{0%{transform:translateX(0) rotate(0)}5%{transform:translateX(-3px) rotate(-1deg)}10%{transform:translateX(3px) rotate(1deg)}15%{transform:translateX(-3px) rotate(-1deg)}20%{transform:translateX(3px) rotate(1deg)}25%{transform:translateX(-2px) rotate(-0.6deg)}30%{transform:translateX(2px) rotate(0.6deg)}35%{transform:translateX(-1px) rotate(-0.4deg)}40%{transform:translateX(1px) rotate(0.4deg)}50%{transform:translateX(0) rotate(0)}100%{transform:translateX(0) rotate(0)}}`}</style>
      <div className={`absolute -right-2 top-0 w-full h-full rounded-lg bg-fuchsia-500 transform rotate-2`} />
      <button
        {...props}
        className={topButton}
  style={{ animation: 'buzz 2s infinite' }}
        aria-label={props['aria-label'] ?? (typeof children === 'string' ? children : 'Choose project')}
      >
        {children}
      </button>
    </div>
  )
}
