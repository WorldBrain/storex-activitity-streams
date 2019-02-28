import * as expect from 'expect'
import { TEST_ACTIVITY_TYPES, setupStorexTest, TEST_OBJECT_TYPES } from '../index.tests'
import { PullActivitityStreamStorage, PullActivityStreamStorageSettings } from './pull-activities'

describe('PullActivityStreamStorage', () => {
    async function setupTest() {
        const pullActivitySettings : PullActivityStreamStorageSettings = {
            objectPkType: 'int',
            childPkType: 'int',
            objectTypes: TEST_OBJECT_TYPES,
            activityTypes: TEST_ACTIVITY_TYPES,
        }
        return setupStorexTest<{pullActivityStreams : PullActivitityStreamStorage}>({
            collections: {},
            modules: {
                pullActivityStreams: ({storageManager}) => new PullActivitityStreamStorage({storageManager, settings: pullActivitySettings})
            }
        })
    }

    it('should allow publishing and pulling activities', async () => {
        const { modules: { pullActivityStreams } } = await setupTest()
        await pullActivityStreams.publishActivity({
            activityType: 'post:publish',
            objectPk: 3,
            childPk: 5,
            createdOn: 1111,
        })
        await pullActivityStreams.publishActivity({
            activityType: 'post:publish',
            objectPk: 3,
            childPk: 6,
            createdOn: 2222,
        })
        await pullActivityStreams.publishActivity({
            activityType: 'post:publish',
            objectPk: 4,
            childPk: 7,
            createdOn: 3333,
        })
        const updates = await pullActivityStreams.getUpdatesByObjects({objects: [{type: TEST_OBJECT_TYPES.user.id, pk: 3}]})
        expect(updates).toEqual([
            {
                id: 1,
                objectType: TEST_OBJECT_TYPES['user'].id,
                activityType: TEST_ACTIVITY_TYPES['post:publish'].id,
                objectPk: 3,
                childPk: 5,
                createdOn: 1111,
            },
            {
                id: 2,
                objectType: TEST_OBJECT_TYPES['user'].id,
                activityType: TEST_ACTIVITY_TYPES['post:publish'].id,
                objectPk: 3,
                childPk: 6,
                createdOn: 2222,
            }
        ])
    })
})
