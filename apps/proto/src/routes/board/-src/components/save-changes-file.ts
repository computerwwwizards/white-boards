import type { RecordsDiff, TLEditorSnapshot, TLRecord } from "tldraw";

export async function saveChanges(
  diff: RecordsDiff<TLRecord>, 
  snapshot: TLEditorSnapshot,
  folderHandle: FileSystemDirectoryHandle
){
  const snapshotHandle = await folderHandle.getFileHandle('snapshot', {
    create: true
  })
  const writter = await snapshotHandle.createWritable();

  try {
    await writter.write(JSON.stringify(snapshot.document))
  } finally{
    await writter.close();
  }
}