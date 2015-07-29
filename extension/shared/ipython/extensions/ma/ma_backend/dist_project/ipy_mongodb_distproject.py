from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

client = MongoClient('10.19.0.20', 27017)
db = client.ma
dp = db.distprojects


def getAllProjects():
    # TO DO: implement method
    result = list()
    for p in dp.find():
        p['_id'] = str(p['_id'])
        result.append(p)
    logger.info(result)
    return result

def getProjectById(project_id):
    # TO DO: implement method
    result = dp.find_one({'gid':project_id})
    result['_id'] = str(result['_id'])
    return result

def addProject(project):
    # TO DO: implement method
    #dp.insert_one(project);
    dp.update({'gid':project['gid']}, {"$set": project}, upsert=True)


def removeProject(project_id):
    # TO DO: implement method
    dp.remove({'gid': project_id})

def updateProject(project):
    # TO DO: implement method
    del project['_id']
    dp.update({'gid':project['gid']}, {"$set": project}, upsert=False)
