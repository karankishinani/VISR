import sys, json

f1 = open(sys.argv[1], 'r', encoding='utf-16')
r1 = f1.readline()
f2 = open(sys.argv[2], 'w', encoding='utf-8')

while r1:
	print(r1)
	j1 = json.loads(r1)
	j2 = {}
	j2['year'] = j1['year']
	j2['orgs'] = j1['orgs']
	j2['fos'] = int(j1['fos'])
	f2.write(str(j2).replace('\'', '"') + '\n')
	r1 = f1.readline()
