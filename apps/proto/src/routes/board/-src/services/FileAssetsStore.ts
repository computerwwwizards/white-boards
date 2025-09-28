import type { JsonObject, TLAsset, TLAssetStore } from "tldraw";


export function createFileAssestStore(
  fileSystemHandle: FileSystemDirectoryHandle
):TLAssetStore{
  return {
    async upload(
    asset: TLAsset, 
    file: File, 
    _abortSignal?: AbortSignal
  ): Promise<{ meta?: JsonObject; src: string; }> {
    console.log(asset)
    const name = asset.id.replace(/\:|\-/g, '')
    console.log(name)
    const fileHandle = await fileSystemHandle.getFileHandle(name, {
      create: true
    })

    const writer = await fileHandle.createWritable()

    await writer.write(file)

    await writer.close();


    return {
      src: ''
    }
  },
  async resolve(asset){
    const name = asset.id.replace(/\:|\-/g, '')

    const fileHandle = await fileSystemHandle.getFileHandle(name)

    const file = await fileHandle.getFile()

    return URL.createObjectURL(file)
  }
  }
}
