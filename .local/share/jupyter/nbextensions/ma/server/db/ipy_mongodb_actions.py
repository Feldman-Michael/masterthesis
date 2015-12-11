# Copyright (c) Cristian Anastasiu
# Python module which provides methods
# for connecting to the local MongoDB instance
# usint Pymongo
# This module provides the interface for the
# actions MongoDB collection
#

from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Connect to local MongoDB
client = MongoClient('localhost', 27017)
db = client.ma

# Switch to the actions db
dp = db.actions


# Method for retrieving all the actions
def getAllActions():
    result = list()
    for p in dp.find():
        # Setting the "_id" ad the "id" attribute
        if 'id' not in p:
            p['id'] = str(p['_id'])
        # "_id" is of type ObjectId, make it string
        p['_id'] = str(p['_id'])
        result.append(p)
    return result

# Method for retrieving all the actions from a specific category
# param
def getAllActionsByCategory(categoryid):
    result = list()
    for p in dp.find({'categoryid': categoryid}):
        p['_id'] = str(p['_id'])
        result.append(p)
    return result

# Method for retrieving actions by ID
def getActionById(acid):
    logger.info(ObjectId(acid))

    ret = db.actions.find_one({'_id': ObjectId(acid)})
    ret['_id'] = str(ret['_id'])
    return ret

# Method for adding an action to the db
def addAction(action):
    ret = dp.insert_one(action)
    result = str(ret.inserted_id)
    return result

# Method for removing action by id
def removeAction(action_id):
    return dp.remove({'_id': ObjectId(action_id)})

# Method for updating action document in db
def updateAction(action):
    myid = action['_id']
    del action['_id']
    return dp.update({'_id':ObjectId(myid)}, {"$set": action}, upsert=False)
