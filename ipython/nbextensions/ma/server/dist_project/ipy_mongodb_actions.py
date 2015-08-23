from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

client = MongoClient('10.19.0.20', 27017)
db = client.ma
dp = db.actions


def getAllActions():
    # TO DO: implement method
    result = list()
    for p in dp.find().sort([("categoryid", 1)]):
        p['_id'] = str(p['_id'])
        result.append(p)
    logger.info(result)
    return result

def getAllActionsByCategory(categoryid):
    # TO DO: implement method
    result = list()
    for p in dp.find({'categoryid': categoryid}):
        p['_id'] = str(p['_id'])
        result.append(p)
    logger.info(result)
    return result


def getActionById(action_id):
    # TO DO: implement method
    result = dp.find_one({'_id':ObjectId(action_id)})
    result['_id'] = str(result['_id'])
    return result

def addAction(action):
    # TO DO: implement method
    dp.insert_one(action)
    #dp.update({'_id':ObjectId(action._id)}, {"$set": action}, upsert=True)


def removeAction(action_id):
    # TO DO: implement method
    dp.remove({'_id': ObjectId(action_id)})

def updateAction(action):
    # TO DO: implement method
    myid = action['_id']
    del action['_id']
    dp.update({'_id':ObjectId(myid)}, {"$set": action}, upsert=False)
