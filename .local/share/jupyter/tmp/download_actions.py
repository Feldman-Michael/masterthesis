import requests
import csv
import json
cd = '/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/git/pycard.ifi.uzh.ch/tmp/'

payload = {'operation': 'get_children', 'id': '2'}
r = requests.get("http://dataprocessing.aixcape.org/scripts/jstree/_demo/work_step.php", params=payload)
result = r.json()

an = open(cd+'action_nodes.csv','wb')
wrtr = csv.writer(an, delimiter=',', quotechar='"',lineterminator='\n')

ad = open(cd + 'action_data.csv','wb')
wrtr2 = csv.writer(ad, delimiter='\t', quotechar='"',lineterminator='\n')

wrtr.writerow([2,"Data Pre-processing",'root','none'])

def parseResult(res,d,parentId):
    for x in range(0,len(res)) :
        ind = []
        #{u'state': u'closed', u'data': u'Data Denoising (17)', u'attr': {u'id': u'node_44', u'rel': u'folder'}}
        wrtr.writerow([res[x]['attr']['id'].split("_")[-1],res[x]['data'],res[x]['attr']['rel'],parentId])

        for y in range(0,d):
            ind.append('\t')
        ind.append(res[x]['data'])
        print("".join(ind))
        if res[x]['attr']['rel'] == 'folder':
            payload = {'operation': 'get_children', 'id': res[x]['attr']['id'].split("_")[-1]}
            r = requests.get("http://dataprocessing.aixcape.org/scripts/jstree/_demo/work_step.php", params=payload)
            parseResult(r.json(), d+1,res[x]['attr']['id'].split("_")[-1])
        else:
            nid = res[x]['attr']['id'].split("_")[-1]
            payload = {'operation': 'get_data', 'id': nid }
            r = requests.get("http://dataprocessing.aixcape.org/scripts/jstree/_demo/work_step.php", params=payload)
            r = r.json()
            #[u'status', u'alg_description', u'literature', u'work_process_id',
            # u'description', u'alg_literature', u'alg_tools', u'alg_input', u'alg_output',
            #u'step_classifier', u'full_title', u'alg_classifier', u'output', u'image_data',
            #u'input', u'tools', u'id', u'alg_full_title']

            #wrtr2.writerow([r['id'],r['status'],r['alg_description'],r['literature'],r['description'],r['work_process_id'],r['alg_literature'],
            #r['alg_tools'],r['alg_input'],r['alg_output'],r['step_classifier'],r['full_title'],['alg_classifier'],r['output'],r['input'],
            #r['tools'],r['alg_full_title']])
            #print(r.json()['description'])
            r['description'] = r['description'].replace('\n', '<br />')
            r['output'] = r['output'].replace('\n', '<br />')
            r['input'] = r['input'].replace('\n', '<br />')
            wrtr2.writerow([nid,r['description'],r['output'],r['input']])


parseResult(result,0,2)
an.close()
ad.close()
