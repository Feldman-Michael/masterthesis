# Copyright (c) Cristian Anastasiu
# Python module which provides methods
# for connecting to the local MongoDB instance
# usint Pymongo
# This module provides the interface for the
# distprojects MongoDB collection
#

from pymongo import MongoClient, DESCENDING, ASCENDING
from bson.objectid import ObjectId
import logging
import re

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Connect to local MongoDB
client = MongoClient('localhost', 27017)
db = client.ma

# Switch to distprojects db
dp = db.distprojects

# Method for retrieving all projects
def getAllProjects():
    # TO DO: implement method
    result = list()
    for p in dp.find():
        # Get Creation date in human readable form from ObjectID
        p['created_date'] = p['_id'].generation_time.strftime('%d %b %Y')
        # Get last_modified_date in human readable form
        if 'last_modified_date' in p:
            p['last_modified_date'] = p['last_modified_date'].strftime('%d %b %Y')
        # Return _id as string and not as ObjectId
        p['_id'] = str(p['_id'])
        result.append(p)
    return result

# Method for retrieving all projects for a specific user
# param - user ID (email)
def getAllProjectsByUser(user):
    result = list()
    logger.info(user)

    # Find all projects where user is either project owner or one of the assignment worker
    # Sort results by last_modified_date in descending order
    for p in dp.find({"$or": [ {'owner': re.compile(user, re.IGNORECASE)}, {'bundles.owner': re.compile(user, re.IGNORECASE)} ]} ).sort([
        ('last_modified_date', DESCENDING),('_id', DESCENDING)]):
        # Get creation time in human readable form
        p['created_date'] = p['_id'].generation_time.strftime('%d %b %Y')
        # Get last_modified_date in human readable form
        if 'last_modified_date' in p:
            p['last_modified_date'] = p['last_modified_date'].strftime('%d %b %Y')
        # Return _id as string and not as ObjectId
        p['_id'] = str(p['_id'])
        result.append(p)
    return result

# Method for retrieving project by ID
# param - project id (Google ID)
def getProjectById(project_id):

    result = dp.find_one({'gid':project_id})
    # Get creation time in human readable form
    result['created_date'] = result['_id'].generation_time.strftime('%d %b %Y')
    # Get last_modified_date in human readable form
    if 'last_modified_date' in result:
        result['last_modified_date'] = result['last_modified_date'].strftime('%d %b %Y')
    # Return _id as string and not as ObjectId
    result['_id'] = str(result['_id'])
    return result

# Method for adding project to database. It is using the update method with upsert=True.
# This will first try to update the project, if the project doesnt exist it will
# create a new document in the Mongo DB
# param - project dictionary.
def addProject(project):
    return dp.update({'gid':project['gid']}, {"$set": project}, upsert=True)

# Method for removing project by id
# param - project id (Google ID)
def removeProject(project_id):
    return dp.remove({'gid': project_id})

# Method for removing project by id where user is owner
# param - project id
# param - user id
def removeProjectByUser(project_id, user):
    # TO DO: implement method
    return dp.remove({'gid': project_id, 'owner': re.compile(user, re.IGNORECASE) })

# Method for updating project
def updateProject(project):
    del project['_id']
    return dp.update({'gid':project['gid']}, {"$set": project}, upsert=False)
