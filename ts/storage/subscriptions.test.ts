import * as expect from 'expect'
import { setupStorexTest, TEST_OBJECT_TYPES } from '../index.tests';
import { ActivitySubscriptionStorage, ActivitySubscriptionStorageSettings } from './subscriptions';

describe('ActivitySubscriptionStorage', () => {
    async function setupTest() {
        const subscriptionSettings : ActivitySubscriptionStorageSettings = {
            subscriberCollection: 'user',
            objectPkType: 'int',
            objectTypes: TEST_OBJECT_TYPES
        }
        return setupStorexTest<{subscriptions : ActivitySubscriptionStorage}>({
            collections: {
                user: {
                    version: new Date(),
                    fields: {
                        displayName: {type: 'string'}
                    }
                }
            },
            modules: {
                subscriptions: ({storageManager}) => new ActivitySubscriptionStorage({storageManager, settings: subscriptionSettings})
            }
        })
    }

    it('should be able to register and list subscriptions by subscriber', async () => {
        const { modules: { subscriptions } } = await setupTest()
        await subscriptions.subscribe({ subscriberId: 5, objectType: 'user', objectPk: 3 })
        expect(await subscriptions.getSubcriptions({ subscriberId: 5 })).toEqual([
            {
                id: expect.anything(),
                user: 5,
                objectType: TEST_OBJECT_TYPES.user.id,
                objectPk: 3,
            }
        ])
    })

    it('should allow users to store their last pull times', async () => {
        const { modules: { subscriptions } } = await setupTest()
        await subscriptions.subscribe({ subscriberId: 5, objectType: 'user', objectPk: 3 })
        expect(await subscriptions.getLastPull({ subscriberId: 5 })).toEqual(null)
        await subscriptions.updateLastPull({ subscriberId: 5, timestamp: 55 })
        // expect(await subscriptions.getLastPull({ subscriberId: 5 })).toEqual(55)
    })
})
