import sqlite3
import random
import csv

conn = sqlite3.connect('/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/3/database.sqlite')
c = conn.cursor()

csvWriter = csv.writer(open("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/3/reddit.csv", "w"))

for x in range(0, 545044):
    offset=random.randrange(54504410)
    #print('Offset: %s', offset)
    c.execute('SELECT * FROM May2015 where rowid = ' + str(offset))
    for row in c:
        csvWriter.writerow(row)
c.close()
#print(c.fetchone())
