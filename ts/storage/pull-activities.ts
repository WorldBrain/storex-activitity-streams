import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs } from '@worldbrain/storex-pattern-modules'
import { ActivityTypes, ObjectTypes } from '../types';

export interface PullActivityStreamStorageSettings {
    objectPkType : 'int' | 'string'
    childPkType : 'int' | 'string'
    activityTypes : ActivityTypes
    objectTypes : ObjectTypes
}
export class PullActivitityStreamStorage extends StorageModule {
    private settings : PullActivityStreamStorageSettings

    constructor({settings, ...rest} : {settings : PullActivityStreamStorageSettings} & StorageModuleConstructorArgs) {
        super(rest)

        this.settings = settings
    }

    getConfig() : StorageModuleConfig {
        return {
            collections: {
                pullActivityStreamEntry: {
                    version: new Date(2019, 1, 18),
                    fields: {
                        createdOn: {type: 'timestamp'},
                        objectType: {type: 'int'},
                        activityType: {type: 'int'},
                        objectPk: {type: this.settings.objectPkType},
                        childPk: {type: this.settings.childPkType, optional: true},
                    }
                },
            },
            operations: {
                publishActivity: {
                    operation: 'createObject',
                    collection: 'pullActivityStreamEntry'
                },
                getUpdatesByObject: {
                    operation: 'findObjects',
                    collection: 'pullActivityStreamEntry',
                    args: {
                        objectType: `$objectType:number`,
                        objectPk: `$objectPk:${this.settings.objectPkType}`,
                        createdOn: {$gt: `$since:timestamp`},
                    }
                },
            },
        }
    }

    async publishActivity(entry : {activityType : string, objectPk : string | number, childPk : string | number, createdOn : number}) {
        const activityType = this.settings.activityTypes[entry.activityType]
        await this.operation('publishActivity', {
            ...entry,
            activityType: activityType.id,
            objectType: this.settings.objectTypes[activityType.objectCollection].id,
        })
    }

    async getUpdatesByObjects(options : {objects : Array<{type : number, pk: string | number}>, since? : number}) {
        const resultPromises = options.objects.map(object =>
            this.operation('getUpdatesByObject', {objectType: object.type, objectPk: object.pk, since: options.since || 0})
        )
        const results = await Promise.all(resultPromises)
        const flattened : Array<any> = results.reduce((prev : any[], curr) => [...prev, ...curr], [])
        return flattened
    }
}
