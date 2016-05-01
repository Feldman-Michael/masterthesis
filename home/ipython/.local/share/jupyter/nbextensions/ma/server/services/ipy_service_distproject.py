# Copyright (c) Cristian Anastasiu
# Notebook Server Extension which provides the REST services
# for {project} resources
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
import IPython.nbformat.v4 as nbfv4
import IPython.nbformat as nbf
import logging
import random
import string
import shutil
import os
import html2text
from server.db import ipy_mongodb_distproject as db


logger = logging.getLogger()

from notebook.services.config import ConfigManager
cm = ConfigManager()
nb = cm.get('notebook')


# JSON encoder for responses of pymongo operations
class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

# Service endpoints:
#
#    /distprojects:
#        POST:
#            description: Create new Distributed Project
#        PUT:
#            description: Updates an existing project
#        GET:
#            description: Returns project collection
#
#    /distprojects/convert:
#            POST:
#                description: Converts a project JSON object to a JSON object containing IPython notebooks
#    /distprojects/{prid}:
#            GET:
#                description: Returns project with specified id
#            DELETE:
#                description: Deletes project with specified id


class DistProjectHandler(IPythonHandler):
    @web.authenticated

    # Check request origin
    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith(nb['ma_server_url'] + ":"+nb['ma_server_port'])

    # GET requests
    def get(self,prid=None):
        # Get username. We will retrieve only the requests where the user is involved
        username = self.get_argument('username')
        if username:
            if prid:
                # Retrieve the results from mongodb by id
                result = db.getProjectById(prid)
                self.write(json.dumps(result))
                self.set_status(200)
            else:
                # Retrieve the results from mongodb
                response = {'items' : db.getAllProjectsByUser(username)}
                self.write(json.dumps(response))
                self.set_status(200)
        else:
            self.set_status(404)

    # PUT requests
    def put(self):
        # Get JSON payload
        json_data = tornado.escape.json_decode(self.request.body)
        # Perform update operation
        ret = db.updateProject(json_data)
        if ret['ok'] == 1.0:
            self.set_status(200)

    # POST requests
    def post(self, convert=False):
        # Check if this is a convert operation
        if convert:
            # Get JSON payload
            json_data = tornado.escape.json_decode(self.request.body)
            # Go through all the assignments / bundles in the project payload
            for x in json_data['bundles']:
                # Create a notebook version4 object
                nb = nbfv4.new_notebook()
                # Create the task description
                task_description = '## Task \n' +  x['description'] + '\n'\
                                    '___ \n' \
                                    '#### '+ x['owner'] + '\n' \
                                    '___ \n'
                # Create the general description string
                common_description ='#### Temporary folder \n' \
                                    'Set your working dir to following folder '+ json_data['gid']+'. Upload your csv/data files into '\
                                    'this directoy to use them.<br/>'\
                                    '`ftp://pycard.ifi.uzh.ch/data/'+json_data['gid']+'`'\
                                    '<br/><br/>'\
                                    'Use with R Kernel <br/>' \
                                    '`setwd("./'+ json_data['gid']+'")` <br/><br/>' \
                                    'Use with Python Kernel <br/> ' \
                                    '`import os` <br/>' \
                                    '`os.chdir("./'+ json_data['gid']+'")` \n' \
                                    '___ \n' \
                                    '#### Notes board \n' \
                                    'In order to avoid conflicts between notebooks and have a clean transition from one step to another, use the shared notes file ' \
                                    'shared.txt . The contents of the file will be loaded and made in every notebook, so it is a good place to register variable names used in the different steps, or to provide feedback after each iteration.  <br/><br/>'
                # Add the task_description as a markdown cell
                heading = nbfv4.new_markdown_cell(task_description)
                # Set the task_description as read-only
                heading['metadata'].run_control = dict()
                heading['metadata'].run_control['read_only'] = True
                # Append cell to notebook
                nb['cells'].append(heading)

                # Add the common description cell as a markdown cell
                common = nbfv4.new_markdown_cell(common_description)
                # Set the common description cell as read only
                common['metadata'].run_control = dict()
                common['metadata']['common'] = True
                common['metadata'].run_control['read_only'] = True
                # Add the cell to the notebook
                nb['cells'].append(common)

                # Create a markdown cell for the note board, set the variable_cell metadata to true
                variablesh = nbfv4.new_markdown_cell()
                variablesh['metadata']['variable_cell'] = True
                nb['cells'].append(variablesh)

                # Set the notebook kernel in metadata
                nb['metadata']['language'] = json_data['kernel']
                # Set cell toolbar to Side Comments in metadata
                nb['metadata']['celltoolbar'] = "Side Comments"
                # Set project ID in metadata
                nb['metadata']['pgid'] = json_data['gid']
                # Set id of notes board for this project (shared_notes.txt file)
                nb['metadata']['variablesid'] = json_data['variablesid']
                # Set Google ID for this notebook
                nb['metadata']['id'] = x['gid']

                # Go through all the actions in the assignment
                for a in x['actions']:
                    # Create action description text
                    text = '#### This is the description of the actions that need to be implemented.' \
                    '\n' \
                    '### ' + a['name'] + '\n' \
                    'Description:   ' + a['description'] + '<br>' \
                    'Input:         ' + a['input'] + '<br>' \
                    'Output:        ' + a['output']

                    code = "# Enter implementation here."
                    # Add the description cell as a markdown cell, set it read-only
                    desc = nbfv4.new_markdown_cell(text)
                    desc['metadata'].run_control = dict()
                    desc['metadata'].run_control['read_only'] = True
                    nb['cells'].append(desc)

                    # Create the cell code for this action
                    code_cell = nbfv4.new_code_cell(code)
                    code_cell['metadata'].side_comments = dict()

                    # Create the cell code for this action, set the section id needed
                    # for the SideComments extension as metadata

                    code_cell['metadata'].side_comments['id'] = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(20))
                    logger.info(code_cell['metadata'])
                    # Add cell to notebook
                    nb['cells'].append(code_cell)
                # Add the contents of the created notebook a the bundle {notebook} property in the project payload
                x['notebook'] = nbf.writes(nb,version=4)


            json_data['variables'] = html2text.html2text(json_data['variables'])

            # Send the answer back to client
            self.write(json.dumps(json_data, cls=Encoder))
            self.set_status(201)

        else:
            # Get the project payload from the client
            json_data = tornado.escape.json_decode(self.request.body)
            # Add the project to the database
            ret = db.addProject(json_data)
            if ret['ok'] == 1.0:
                # If project was added, create temporary work folder for the project
                # which can be accessed through ftp
                if not os.path.exists('/ftp/ipython/data/' + json_data['gid']):
                    os.makedirs('/ftp/ipython/data/' + json_data['gid'])
                    os.chmod('/ftp/ipython/data/' + json_data['gid'], 0o755)
                self.set_status(201)

    def delete(self, prid):
        # Get the username
        username = self.get_argument('username')
        if username:
            # Remove the project from db
            ret = db.removeProjectByUser(prid, username)
            if ret['ok'] == 1.0:
                # Remove project folder from server
                shutil.rmtree('/ftp/ipython/data/' + prid, ignore_errors=True)
                self.set_status(200)
        else:
            self.set_status(404)
