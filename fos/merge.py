import json

f1 = open('superclean-fos.txt', 'r')
f2 = open('fos0416', 'r')
f3 = open('clean-merged.txt', 'w', encoding='utf-16')

r1 = f1.readline()
r2 = f2.readline()

while r1 and r2:
	out = {}
	# get orgs & year
	d1 = json.loads(r1)
	if 'year' in d1:
		out['year'] = d1['year']
	if 'authors' in d1:
		out['orgs'] = [x['org'] for x in d1['authors'] if 'org' in x]
	# get fos
	out['fos'] = int(r2[:-1])
	f3.write(str(out).replace('\'', '"') + '\n')

	# loop
	r1 = f1.readline()
	r2 = f2.readline()
