import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs } from '@worldbrain/storex-pattern-modules'
import { ObjectTypes } from '../types';
// import { ActivityTypes } from '../types';

export interface ActivitySubscriptionStorageSettings {
    subscriberCollection : string
    objectPkType : 'int' | 'string'
    objectTypes : ObjectTypes
    // activityTypes : ActivityTypes
}
export class ActivitySubscriptionStorage extends StorageModule {
    private settings : ActivitySubscriptionStorageSettings

    constructor({settings, ...rest} : {settings : ActivitySubscriptionStorageSettings} & StorageModuleConstructorArgs) {
        super(rest)

        this.settings = settings
    }

    getConfig = () : StorageModuleConfig => ({
        collections: {
            activitySubscription: {
                version: new Date(2019, 1, 18),
                fields: {
                    createdOn: {type: 'timestamp'},
                    objectType: {type: 'int'},
                    objectPk: {type: this.settings.objectPkType},
                },
                relationships: [
                    {childOf: this.settings.subscriberCollection}
                ],
                uniqueTogether: [[this.settings.subscriberCollection, 'objectType', 'objectPk']],
            },
            activitySubscriberInfo: {
                version: new Date(2019, 1, 18),
                fields: {
                    lastPull: {type: 'timestamp', optional: true},
                },
                relationships: [
                    {childOf: this.settings.subscriberCollection}
                ],
            },
        },
        operations: {
            addSubscription: {
                operation: 'createObject',
                collection: 'activitySubscription'
            },
            removeSubscription: {
                operation: 'deleteObject',
                collection: 'activitySubscription',
                args: {id: '$subscriptionId'}
            },
            findSubscription: {
                operation: 'findObjects',
                collection: 'activitySubscription',
                args: {[this.settings.subscriberCollection]: '$subscriberId'}
            },
            findSubscriberInfo: {
                operation: 'findObject',
                collection: 'activitySubscriberInfo',
                args: {[this.settings.subscriberCollection]: '$subscriberId'}
            },
            createSubscriberInfo: {
                operation: 'createObject',
                collection: 'activitySubscriberInfo',
            },
            updateLastPull: {
                operation: 'updateObjects',
                collection: 'activitySubscriberInfo',
                args: [{[this.settings.subscriberCollection]: '$subscriberId'}, {lastPull: '$timestamp:timestamp'}]
            }
        },
    })

    async subscribe(entry : {subscriberId, objectType : string, objectPk : string | number}) {
        if (!await this.operation('findSubscriberInfo', {subscriberId: entry.subscriberId})) {
            await this.operation('createSubscriberInfo', {[this.settings.subscriberCollection]: entry.subscriberId, lastPull: null})
        }
        await this.operation('addSubscription', {
            [this.settings.subscriberCollection]: entry.subscriberId,
            objectType: this.settings.objectTypes[entry.objectType].id,
            objectPk: entry.objectPk,
        })
    }

    async unsubscribe() {

    }

    async getSubcriptions(options : {subscriberId}) {
        return this.operation('findSubscription', options)
    }

    async updateLastPull(options : {subscriberId, timestamp : number}) {
        await this.operation('updateLastPull', options)
    }

    async getLastPull(options : {subscriberId}) : Promise<number> {
        const subscriberInfo = await this.operation('findSubscriberInfo', options)
        return subscriberInfo ? subscriberInfo.lastPull : null
    }
}
