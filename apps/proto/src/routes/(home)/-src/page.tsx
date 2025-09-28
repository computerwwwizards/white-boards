import { use, useCallback } from "react"
import { ServicesContext } from "../../../context/services"
import { Route as BoardRoute } from '../../board'

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

  return <div>
    <button onClick={onClick}>
      Select the folder of your project
    </button>
  </div>
}