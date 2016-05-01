import random
import csv
import os

#file_size = len(f.readlines())
#print(file_size)

os.remove("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/2/csv_pus/ss14pus_select.csv")

file_size_a = 1611956
file_size_b = 1520655
f=open("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/2/csv_pus/ss14pusa.csv",'r')
o=open("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/2/csv_pus/ss14pus_select.csv", 'w')
f.seek(0)
random_line=f.readline()
o.write(random_line)

for i in range(0,16119):
    offset=random.randrange(file_size_a)
    f.seek(offset)
    f.readline()
    random_line=f.readline()
    o.write(random_line)
f.close()
o.close()

f=open("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/2/csv_pus/ss14pusb.csv",'r')
o=open("/Users/anastasi/Dokumentation/_MasterUZH/Courses/SS15/MasterArbeit/project/datasets/2/csv_pus/ss14pus_select.csv", 'a')
f.seek(0)
random_line=f.readline()
for i in range(0,15206):
    offset=random.randrange(file_size_b)
    f.seek(offset)
    f.readline()
    random_line=f.readline()
    o.write(random_line)
f.close()
o.close()
