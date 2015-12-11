#!/usr/bin/env python

import sys
import json
#import collections.UserDict

class Node(object):
    def __init__(self, nid, parent, name, description, input, output):
        self.nid = nid
        self.parent = parent
        self.children = []
        self.name = name
        self.description = description
        self.input = input
        self.output = output

class NodeDict(dict):
    def addNodes(self, nodes):
        """ Add every node as a child to its parent by doing two passes."""
        for i in (1, 2):
            for node in nodes:
                self[node.nid] = node
                if node.parent in self.keys():
                    if node.parent != "none" and node not in self[node.parent].children:
                        self[node.parent].children.append(node)

class NodeJSONEncoder(json.JSONEncoder):
    def default(self, node):
        if type(node) == Node:
            return {'id':node.nid,
                    'name':node.name,
                    'description': node.description,
                    'input': node.input,
                    'output': node.output,
                    'children':node.children}
        raise TypeError("{} is not an instance of Node".format(node))

def getJSONTree(result):
    nodes = []

    for x in result:
        nodes.append(Node(x['id'], x['parent'],x['name'],x['description'],x['input'],x['output']))

    nodeDict = NodeDict()
    nodeDict.addNodes(nodes)

    rootNodes = [node for nid, node in nodeDict.items()
                 if node.parent == "none"]

    return NodeJSONEncoder().encode(rootNodes[0])
