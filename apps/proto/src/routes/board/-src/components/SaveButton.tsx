import { use, useCallback, useEffect, useRef, useState } from "react"
import { squashRecordDiffs, useEditor, type RecordsDiff, type TLEventMapHandler, type TLRecord } from "tldraw"
import { ServicesContext } from "../../../../context/services"
import { saveChanges } from "./save-changes-file"

function isPlainObjectEmpty(obj: object) {
	for (const _key in obj) return false
	return true
}




export default function SaveButton() {
	const editor = useEditor()
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	const rUnsavedChanges = useRef<RecordsDiff<TLRecord>>({ added: {}, removed: {}, updated: {} })

	useEffect(() => {
		const handleDocumentChange: TLEventMapHandler<'change'> = (diff) => {
			squashRecordDiffs([rUnsavedChanges.current, diff.changes], { mutateFirstDiff: true })
			setHasUnsavedChanges([
        rUnsavedChanges.current.added, 
        rUnsavedChanges.current.removed,
        rUnsavedChanges.current.updated
      ].some(isPlainObjectEmpty)
			)
		}

		return editor.store.listen(handleDocumentChange, { scope: 'document' })
	}, [editor])

  const serviceLocator = use(ServicesContext)

	const handleSave = useCallback(async () => {
		const diff = rUnsavedChanges.current

		const snapshot = editor.getSnapshot()

    // TODO: decouple from a service
    // we need a crud that makes operations with file system
		await saveChanges(diff, snapshot, serviceLocator.get("folderHandler"))

		setHasUnsavedChanges(false)

		rUnsavedChanges.current = {
			added: {},
			removed: {},
			updated: {},
		}
	}, [editor])

  useEffect(()=>{
    const intervalId = setInterval(()=>{
      handleSave()
    }, 1000*60*5)

    return ()=>{
      clearInterval(intervalId)
    }
  }, [])

	return (
		<button
			onClick={handleSave}
			disabled={!hasUnsavedChanges}
			style={{
				pointerEvents: 'all',
				padding: '8px 16px',
				marginTop: '6px',
				backgroundColor: hasUnsavedChanges ? '#2d7d32' : '#ccc',
				color: hasUnsavedChanges ? 'white' : '#666',
				border: 'none',
				borderRadius: '4px',
				cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
				fontWeight: '500',
			}}
		>
			{hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
		</button>
	)
}