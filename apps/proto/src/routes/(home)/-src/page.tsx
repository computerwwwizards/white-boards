import { use, useCallback } from "react"
import { ServicesContext } from "../../../context/services"
import { Route as BoardRoute } from '../../board'
import FolderChooseButton from './components/FolderChooseButton'

export default function Page(){
   const navigate = BoardRoute.useNavigate()
   const serviceLocator = use(ServicesContext)

   const onClick = useCallback(async ()=>{
    const folderHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    })

    serviceLocator.bind("folderHandler", {
      provider(){
        return folderHandle
      },
      scope: 'singleton'
    })

    await navigate({
      from: '/',
      to: '/board'
    })
    
  }, [])

  return (
    <main className="h-screen bg-[#191919] grid place-content-center">
      <div className="grid place-items-center">
        <div className="grid">
          <FolderChooseButton onClick={onClick} />
        </div>
      </div>
    </main>
  )
}