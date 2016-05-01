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
from server.db import ipy_mongodb_steps as db


logger = logging.getLogger()

from notebook.services.config import ConfigManager
cm = ConfigManager()
nb = cm.get('notebook')


class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

'''
    /distprojects:
        post:
            description: Create new Step

        put:
            description: Updates an existing step

        get:
            description: Returns steps collection

        /{sid}:
            get:
                description: Returns step with specified id
            delete:
                description: Deletes step with specified id
'''

class StepHandler(IPythonHandler):
    @web.authenticated
    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith(nb['ma_server_url'] + ":" + nb['ma_server_port'])

    def get(self,sid=None):
        if sid:
            #get an item from db
            result = db.getStepById(sid)
            self.write(json.dumps(result))
        else:
            #return all items from db
            response = {'items' : db.getAllSteps()}
            self.write(json.dumps(response))

    def put(self):
        json_data = tornado.escape.json_decode(self.request.body)
        # do your update for item
        db.updateStep(json_data)

    def post(self):
            json_data = tornado.escape.json_decode(self.request.body)
            db.addStep(json_data)
            #self.set_status(201)

    def delete(self, sid):
        # do your deletion for item_id
        db.removeStep(sid)
