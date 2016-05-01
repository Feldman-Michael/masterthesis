import requests
import csv
import json


nodes = dict()
data_nodes = dict()


with open('/home/ipython/.local/share/jupyter/tmp/action_data.csv') as f:
    for row in f.readlines()[0:]:
        #print len(row[:-1].split('\t'))
        print(row)
        nid, description, noutput, ninput = row[:-1].split('\t')
        data_nodes[nid] = {'description': description,'input': ninput, 'output': noutput}


with open('/home/ipython/.local/share/jupyter/tmp/action_nodes.csv') as f:
    for row in f.readlines()[1:]:
        print(row)
        nid, name, ntype, parent = row[:-1].split(',')
        if nid in data_nodes:
            nodes[nid] = {"id": nid,"name": name, "type": ntype, "parent": parent,
                "description": data_nodes[nid]["description"], "input": data_nodes[nid]["input"],
                "output": data_nodes[nid]["output"]}
        else:
            nodes[nid] = {"id": nid,"name": name, "type": ntype, "parent": parent,
                "description": '', "input": '',"output": ''}

        url = "http://pycard.ifi.uzh.ch:8888/actions"

        payload = json.dumps(nodes[nid])
        headers = {'content-type': 'application/json'}

        response = requests.request("POST", url, data=payload, headers=headers)

        print(response.text)
