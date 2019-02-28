export type ObjectType = {id : number}
export type ObjectTypes = {[collection : string] : ObjectType}
export type ActivityType = {id : number, objectCollection : string, childCollection? : string}
export type ActivityTypes = {[activity : string] : ActivityType}
