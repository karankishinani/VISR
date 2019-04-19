import sys, json
from collections import Counter

f = open('superclean-fos.txt', 'r')
r = f.readline()
d = Counter()

while r:
	j = json.loads(r)
	if j['year'] in d:
		d[j['year']] += 1
	else:
		d[j['year']] = 1
	r = f.readline()

print(d.most_common())
