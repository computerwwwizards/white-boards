import { RouterProvider, createRouter } from '@tanstack/react-router'


import { routeTree } from './routeTree.gen'
import { useMemo } from 'react';
import { ChildPreProcessDependencyContainer,  } from '@computerwwwizards/dependency-injection';
import { ServicesContext, type GloabalServices } from './context/services';
import './App.css'
const router = createRouter({ 
  routeTree,
  context: null!
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


const App = () => {
  const globalContainer = useMemo(()=>{
    const container = new ChildPreProcessDependencyContainer<GloabalServices>();

    return container;
  }, [])
  return (
    <ServicesContext value={globalContainer}>
      <RouterProvider 
        router={router} 
        context={{
          serviceLocator: globalContainer
        }}
      />
    </ServicesContext>
  );
};

export default App;
