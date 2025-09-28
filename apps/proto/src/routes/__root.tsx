import React from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { ServicesContainer } from '../context/services'

export const Route = createRootRouteWithContext<
  {serviceLocator: ServicesContainer}
>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}
