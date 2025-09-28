import { useState } from "react";
import { useEditor } from "tldraw"

function SunIcon(props: { width?: number; height?: number }) {
	const { width = 20, height = 20 } = props
	return (
		<svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
			<circle cx="12" cy="12" r="4" fill="currentColor" />
			<g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
				<path d="M12 2v2" />
				<path d="M12 20v2" />
				<path d="M4.93 4.93l1.41 1.41" />
				<path d="M17.66 17.66l1.41 1.41" />
				<path d="M2 12h2" />
				<path d="M20 12h2" />
				<path d="M4.93 19.07l1.41-1.41" />
				<path d="M17.66 6.34l1.41-1.41" />
			</g>
		</svg>
	)
}

function MoonIcon(props: { width?: number; height?: number }) {
	const { width = 20, height = 20 } = props
	return (
		<svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
			<path
				d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
				fill="currentColor"
			/>
		</svg>
	)
}

export default function DarkModeButton() {
	const editor = useEditor()
  const [localColor, setLocalColor] = useState(()=>editor.user.getIsDarkMode())
  
	const handleClick = () => {
    const isDark = editor.user.getIsDarkMode()
		editor.user.updateUserPreferences({ colorScheme: isDark ? 'light' : 'dark' })
    setLocalColor(prev => !prev)
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={localColor}
			aria-label={localColor ? 'Switch to light mode' : 'Switch to dark mode'}
			style={{ pointerEvents: 'all', display: 'inline-flex', alignItems: 'center', gap: 8 }}
		>
			{localColor ? <SunIcon /> : <MoonIcon />}
		</button>
	)
}