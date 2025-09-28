import { useEditor } from "tldraw"

export default function DarkModeButton() {
	const editor = useEditor()

	const handleClick = () => {
		const isDark = editor.user.getIsDarkMode()
		editor.user.updateUserPreferences({ colorScheme: isDark ? 'light' : 'dark' })
	}

	return (
		<button style={{ pointerEvents: 'all' }} onClick={handleClick}>
			Toggle dark mode
		</button>
	)
}