# Copyright (c) Cristian Anastasiu
# Notebook Server Extension which provides the REST services
# for {action} resources
# Extends the Tornado websocket server

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
from server.db import ipy_mongodb_actions as db
from server.helper import ipy_helper_actions as actions_helper

import logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

from notebook.services.config import ConfigManager
cm = ConfigManager()
nb = cm.get('notebook')


# JSON encoder
class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

# Service Endpoints
#    /actions:
#        POST:
#            description: Create new action resource
#
#        PUT:
#            description: Updates an existing action
#
#        GET:
#            description: Returns actions collection
#    /actions/tree:
#        GET:
#            description: returns a collection of all actions as a tree structure
#
#    /actions/{acid}:
#            get:
#                description: Returns action with specified id
#            delete:
#                description: Deletes action with specified id


class ActionHandler(IPythonHandler):
    @web.authenticated

    # Check request origin
    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith(nb['ma_server_url']+":"+nb['ma_server_port'])

    # GET operation
    def get(self,acid=None,tree=None):
        # Checks if the the action ID is present
        if acid:
            response = db.getActionById(acid)
            self.write(json.dumps(response))
        # Checks if request was for tree
        elif tree:
            json_result = actions_helper.getJSONTree(db.getAllActions())
            response = {'items' : json_result}
            self.write(response)
        # Else return all items
        else:
            response = {'items' : db.getAllActions()}
            self.write(json.dumps(response))

    # PUT operation
    def put(self):
        # GET the data JSON payload
        json_data = tornado.escape.json_decode(self.request.body)

        # Call the update function
        ret = db.updateAction(json_data)

        # If update was succesful, return a 200 code
        if ret['ok'] == 1.0:
            self.set_status(200)

    # POST operation
    def post(self):
        # GET the data JSON payload
        json_data = tornado.escape.json_decode(self.request.body)

        # Create the resource, return the ID
        response = {'id' : db.addAction(json_data)}
        self.write(json.dumps(response))
        self.set_status(201)

    # DELETE operation
    def delete(self, acid):
        # Check if action id is present, otherwise return 404
        if acid:
            ret = db.removeAction(acid)
            if ret['ok'] == 1.0:
                self.set_status(200)
        else:
            self.set_status(404)
