import * as expect from 'expect'
import { setupStorexTest, TEST_ACTIVITY_TYPES, TEST_OBJECT_TYPES } from "../index.tests";
import { ActivityStreamStorage, ActivityStreamStorageSettings } from "./activities";
import { ActivitySubscriptionStorage } from './subscriptions';
import { PullActivitityStreamStorage } from './pull-activities';

describe('ActivityStreamStorage', () => {
    async function setupTest(options : {} = {}) {
        return setupStorexTest<{
            activityStreams : ActivityStreamStorage,
            subscriptions : ActivitySubscriptionStorage,
            pullActivities : PullActivitityStreamStorage
        }>({
            collections: {
                user: {
                    version: new Date(),
                    fields: {
                        displayName: {type: 'string'}
                    }
                }
            },
            modules: {
                subscriptions: ({storageManager}) =>
                    new ActivitySubscriptionStorage({storageManager, settings: {
                        subscriberCollection: 'user',
                        objectPkType: 'int',
                        objectTypes: TEST_OBJECT_TYPES,
                    }}),
                pullActivities: ({storageManager}) => 
                    new PullActivitityStreamStorage({storageManager, settings: {
                        objectPkType: 'int',
                        childPkType: 'int',
                        objectTypes: TEST_OBJECT_TYPES,
                        activityTypes: TEST_ACTIVITY_TYPES,
                    }}),
                activityStreams: ({storageManager, modules}) =>
                    new ActivityStreamStorage({
                        storageManager,
                        settings: {
                            subscriptionStorage: modules.subscriptions,
                            pullActivitityStorage: modules.pullActivities,
                            objectTypes: TEST_OBJECT_TYPES,
                            activityTypes: TEST_ACTIVITY_TYPES
                        }
                    })
            }
        })
    }

    it('should be able manage subscriptions and retrieve streams', async () => {
        // TODO: Configure push/pull based on some criteria. Amount of followers? objectType?
        const { storageManager, modules: { activityStreams } } = await setupTest()
        const { object: publisher } = await storageManager.collection('user').createObject({displayName: 'The Best'})
        const { object: subscriber } = await storageManager.collection('user').createObject({displayName: 'John Doe'})
        await activityStreams.subscribe({ subscriberId: subscriber.id, objectType: 'user', objectPk: publisher.id })
        
        await activityStreams.publishActivity({activityType: 'post:publish', objectPk: publisher.id, childPk: 5})
        const activitiesBeforeSeen = await activityStreams.getActivities({ subscriberId: subscriber.id })
        expect(activitiesBeforeSeen).toEqual([
            expect.objectContaining({
                activityType: TEST_ACTIVITY_TYPES['post:publish'].id,
                objectType: TEST_OBJECT_TYPES['user'].id,
                objectPk: publisher.id,
                childPk: 5
            })
        ])

        await activityStreams.markAsSeen({subscriberId: subscriber.id, activities: activitiesBeforeSeen})
        const activities = await activityStreams.getActivities({ subscriberId: subscriber.id })
        expect(activities).toEqual([])
    })
})
