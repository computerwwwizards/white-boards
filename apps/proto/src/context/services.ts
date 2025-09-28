import { createContext } from "react";
import { ChildPreProcessDependencyContainer } from '@computerwwwizards/dependency-injection'


export interface GloabalServices {
  folderHandler: FileSystemDirectoryHandle
}

export type ServicesContainer = ChildPreProcessDependencyContainer<GloabalServices>;

export const ServicesContext = createContext<ServicesContainer>(null!)