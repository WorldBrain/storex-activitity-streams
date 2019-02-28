import * as expect from 'expect'
import StorageManager from '@worldbrain/storex'
import { RegistryCollections } from "@worldbrain/storex/lib/registry";
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { registerModuleCollections, StorageModule } from '@worldbrain/storex-pattern-modules';
import { ActivityTypes, ObjectTypes } from './types';

export const TEST_OBJECT_TYPES : ObjectTypes = {
    user: {id: 1},
}
export const TEST_ACTIVITY_TYPES : ActivityTypes = {
    'post:publish': {id: 1, objectCollection: 'user', childCollection: 'post'},
    'call:publish': {id: 1, objectCollection: 'user', childCollection: 'call'},
    'call:slot-filled': {id: 1, objectCollection: 'user', childCollection: 'call'},
    'call:resolved': {id: 1, objectCollection: 'user', childCollection: 'call'},
}

export async function setupStorexTest<T extends {[name : string] : StorageModule}>(options : {
    collections : RegistryCollections,
    modules : {[name : string] : (options : {storageManager : StorageManager, modules: T}) => StorageModule}
}) {
    const backend = new DexieStorageBackend({idbImplementation: inMemory(), dbName: 'unittest'})
    const storageManager = new StorageManager({backend: backend as any})
    storageManager.registry.registerCollections(options.collections)

    const modules : T = {} as any
    for (const [name, moduleCreator] of Object.entries(options.modules)) {
        const module = modules[name] = moduleCreator({storageManager, modules})
        registerModuleCollections(storageManager.registry, module)
    }
    await storageManager.finishInitialization()
    return { storageManager, modules: modules as T }
}
