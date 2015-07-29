# Copyright (c) IPython-Contrib Team.
# Notebook Server Extension to activate/deactivate javascript notebook extensions
#
import IPython
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
from tornado import web
import json


class New_DistProjectHandler(IPythonHandler):
    """Render the create distributed project interface """
    @web.authenticated
    def get(self):
        self.write(self.render_template('ma/new_distproject.html',
            base_url = self.base_url,
            page_title="New Distributed Project"
            )
        )
