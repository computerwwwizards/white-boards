import { createAutoResolver, ChildPreProcessDependencyContainer  } from '@computerwwwizards/dependency-injection'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createTLStore, Tldraw, type TLAssetStore, type TLStoreWithStatus } from 'tldraw'
import type { GloabalServices } from '../../context/services';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileAssestStore } from './-src/services/FileAssetsStore';

import 'tldraw/tldraw.css'
import SaveButton from './-src/components/SaveButton';
import DarkModeButton from './-src/components/DarkModeButton';

export const Route = createFileRoute('/board/')({
  component: RouteComponent,
  beforeLoad({
    context
  }) {
    if(!context.serviceLocator.get('folderHandler', true))
      throw redirect({
        to: '/'
      })
  },
  loader({
    context
  }){
    const localServiceLocator = new ChildPreProcessDependencyContainer<{
      assetStore: TLAssetStore
    } & GloabalServices>(
      context.serviceLocator
    );

    localServiceLocator
      .bind(
        "assetStore",
        {
          resolveDependencies: createAutoResolver([
            {
              identifier: 'folderHandler'
            }
          ]),
          provider(resolvedDeps: any, _ctx, _meta) {
            return createFileAssestStore(resolvedDeps.folderHandler);
          },
          scope: 'singleton'
        }
      )

    return {
      localServiceLocator
    }
  }
})

function RouteComponent() {
  const { localServiceLocator } = Route.useLoaderData();
  const [store, setStore] = useState<TLStoreWithStatus>(()=>({
    status: 'loading'
  }))

  const createStore =  useCallback(async ()=>{
    const folderHandler: FileSystemDirectoryHandle = localServiceLocator
      .get('folderHandler')
      
    const snapshotFile = await folderHandler.getFileHandle("snapshot", {
      create: true
    })

    const file = await snapshotFile.getFile()
    const content = JSON.parse(await file.text() || '{}')
    
    const innerStore = createTLStore({
      assets:localServiceLocator.get('assetStore'),
      snapshot: content
    });

    setStore({
      store: innerStore,
      status: 'synced-local'
    })
  }, [])

  useEffect(()=>{
    createStore()
  }, [])


  return <div 
    style={{
      position: 'fixed',
      inset: 0
    }}>
      <Tldraw
        inferDarkMode
        licenseKey={import.meta.env.LICENSE ?? 'tldraw-2026-01-06/WyJjemJaaTdkSyIsWyIqIl0sMTYsIjIwMjYtMDEtMDYiXQ.jIga3UefLOJFlZXSWVylA4MJ8Ky6ibKuUn9BVmSmnN0/EyQ6Ig0bxioG8YpLr+02f5nXUycZrIbQWui2X5ovmw'}
        components={{
          TopPanel: ()=><div className='flex gap-5'>
            <SaveButton />
            <DarkModeButton />
          </div>
        }}
        store={store} 
      />
    </div>
}
