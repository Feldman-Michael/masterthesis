from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

client = MongoClient('10.19.0.20', 27017)
db = client.ma
dp = db.steps


def getAllSteps():
    # TO DO: implement method
    result = list()
    for p in dp.find():
        p['_id'] = str(p['_id'])
        result.append(p)
    logger.info(result)
    return result

def getStepById(step_id):
    # TO DO: implement method
    result = dp.find_one({'_id':ObjectId(step_id)})
    result['_id'] = str(result['_id'])
    return result

def addStep(step):
    # TO DO: implement method
    dp.insert_one(step)
    #dp.update({'_id':ObjectId(step._id)}, {"$set": step}, upsert=True)


def removeStep(step_id):
    # TO DO: implement method
    dp.remove({'_id': ObjectId(step_id)})

def updateStep(step):
    # TO DO: implement method
    myid = step['_id']
    del step['_id']
    dp.update({'_id':ObjectId(myid)}, {"$set": step}, upsert=False)
