import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs } from '@worldbrain/storex-pattern-modules'
import { ActivityTypes, ObjectTypes } from '../types';
import { ActivitySubscriptionStorage } from './subscriptions';
import { PullActivitityStreamStorage } from './pull-activities';

export interface ActivityStreamStorageSettings {
    objectTypes : ObjectTypes
    activityTypes : ActivityTypes
    subscriptionStorage : ActivitySubscriptionStorage
    pullActivitityStorage : PullActivitityStreamStorage
}
export class ActivityStreamStorage extends StorageModule {
    private settings : ActivityStreamStorageSettings

    constructor({settings, ...rest} : {settings : ActivityStreamStorageSettings} & StorageModuleConstructorArgs) {
        super(rest)

        this.settings = settings
    }

    getConfig = () : StorageModuleConfig => ({
        collections: {
            
        },
        operations: {
            
        },
    })

    async subscribe(entry : {subscriberId, objectType : string, objectPk : string | number}) {
        return this.settings.subscriptionStorage.subscribe(entry)
    }

    async publishActivity(entry : {activityType : string, objectPk : string | number, childPk : string | number, createdOn? : number}) {
        return this.settings.pullActivitityStorage.publishActivity({...entry, createdOn: entry.createdOn || Date.now()})
    }

    async getActivities(options : { subscriberId : string | number }) {
        const subscriptions = await this.settings.subscriptionStorage.getSubcriptions(options)
        const lastPull = await this.settings.subscriptionStorage.getLastPull(options)
        console.log(lastPull)
        const activities = await Promise.all(subscriptions.map(subscription => this.settings.pullActivitityStorage.getUpdatesByObjects({
            objects: [{type: subscription.objectType, pk: subscription.objectPk}],
            since: lastPull,
        })))
        const flattened : any = activities.reduce((prev : any[], curr : any[]) => [...prev, ...curr], [])
        return flattened
    }

    async markAsSeen({subscriberId, activities} : {subscriberId, activities : Array<{createdOn : number}>}) {
        const timestamp : any = activities.reduce((prev : number, curr) => Math.max(prev, curr.createdOn), 0)
        await this.settings.subscriptionStorage.updateLastPull({subscriberId, timestamp})
    }
}
