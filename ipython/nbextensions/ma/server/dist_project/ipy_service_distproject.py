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
import IPython.nbformat.v4 as nbfv4
import IPython.nbformat as nbf
import logging
import random
import string
from server.dist_project import ipy_mongodb_distproject as db


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
            description: Create new Distributed Project

        put:
            description: Updates an existing project

        get:
            description: Returns project collection

        /convert:
            post:
                description: Converts a project JSON object to a JSON object containing IPython notebooks
        /{prid}:
            get:
                description: Returns project with specified id
            delete:
                description: Deletes project with specified id
'''

class DistProjectHandler(IPythonHandler):
    @web.authenticated
    def get(self,prid=None):
        if prid:
            #get an item from db
            result = db.getProjectById(prid)
            self.write(json.dumps(result))
        else:
            #return all items from db
            response = {'items' : db.getAllProjects()}
            self.write(json.dumps(response))

    def put(self):
        json_data = tornado.escape.json_decode(self.request.body)
        # do your update for item
        db.updateProject(json_data)

    def post(self, convert=False):
        if convert:
            json_data = tornado.escape.json_decode(self.request.body)
            for x in json_data['bundles']:
                nb = nbfv4.new_notebook()
                heading = nbfv4.new_markdown_cell("#" + x['description'])
                nb['cells'].append(heading)
                for a in x['actions']:
                    text = 'This is the description of the action that needs to be implemented' \
                    '<br><br>' \
                    'Action name:   ' + a['name'] + '<br>' \
                    'Description:   ' + a['description'] + '<br>' \
                    'Input:         ' + a['input'] + '<br>' \
                    'Output:        ' + a['output']

                    code = "# Enter implementation here."

                    nb['cells'].append(nbfv4.new_markdown_cell(text))
                    code_cell = nbfv4.new_code_cell(code)
                    code_cell['metadata'].side_comments = dict()
                    code_cell['metadata'].side_comments['id'] = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(20))
                    logger.info(code_cell['metadata'])
                    nb['cells'].append(code_cell)


                x['notebook'] = x.pop('actions')
                x['notebook'] = nbf.writes(nb,version=4)

            '''
            nb.append(nbfv3.new_worksheet(cells=cells))
            '''
            self.write(json.dumps(json_data, cls=Encoder))

        else:
            # do your item creation
            json_data = tornado.escape.json_decode(self.request.body)
            db.addProject(json_data)
            #self.set_status(201)

    def delete(self, prid):
        # do your deletion for item_id
        db.removeProject(prid)


    '''
    {   'owner': 'cristiananastasiu@googlemail.com',
        'id': 'task1',
        'description': 'First task',
        'actions':
        [
            {
            'input': 'Text File in csv format',
            'id': 'action1',
            'output': 'pandas.Dataframe',
            'name': 'importTableFromCSV',
            'description': 'Action will import data from a csv file. Arguments ...'
            },
            {
            'input': 'pandas.Dataframe',
            'id': 'action2',
            'output': 'pandas.Dataframe',
            'name': 'removeNullValuesFromDF',
            'description': 'Action will remove rows which contain Null or NA values.'
            }
        ]
    }

    '''
