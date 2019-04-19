import json
f = open('xxx', 'r', encoding='utf-16')
r = f.readline()

while r:
	j = json.loads(r)
	if 'fos' in j:
		print(j['fos'])
	r = f.readline()
