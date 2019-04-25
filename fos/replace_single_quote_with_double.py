import sys
f = open(sys.argv[1], 'r', encoding='utf-8')
r = f.readline()

while r:
	print(r[:-1].replace('\'', '"').encode('utf-8'))
	r = f.readline()
