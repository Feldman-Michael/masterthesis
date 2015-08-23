# Copyright (c) IPython-Contrib Team.
# Notebook Server Extension to activate/deactivate javascript notebook extensions
#
import IPython
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
import tornado
from tornado import web
import json
import io
import re
import logging
import random
import string
from server.dist_project import ipy_mongodb_actions as db


logger = logging.getLogger()

class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

'''
    /distprojects:
        post:
            description: Create new action

        put:
            description: Updates an existing action

        get:
            description: Returns actions collection

        /{acid}:
            get:
                description: Returns action with specified id
            delete:
                description: Deletes action with specified id
'''

class ActionHandler(IPythonHandler):
    @web.authenticated
    def get(self,acid=None, category=None,cid=None):
        if acid:
            #get an item from db
            result = db.getActionById(acid)
            self.write(json.dumps(result))
        elif(category and cid):
            response = {'items' : db.getAllActionsByCategory(cid)}
            self.write(json.dumps(response))
        elif(category):
            response = {}
            for x in db.getAllActions():
                if x['categoryid'] in response:
                    response[x['categoryid']].append(x)
                else:
                    response[x['categoryid']] = list()
                    response[x['categoryid']].append(x)
            self.write(json.dumps(response))
        else:
            #return all items from db
            response = {'items' : db.getAllActions()}
            self.write(json.dumps(response))

    def put(self):
        json_data = tornado.escape.json_decode(self.request.body)
        # do your update for item
        db.updateAction(json_data)

    def post(self):
            json_data = tornado.escape.json_decode(self.request.body)
            db.addAction(json_data)
            #self.set_status(201)

    def delete(self, acid):
        # do your deletion for item_id
        db.removeAction(acid)
