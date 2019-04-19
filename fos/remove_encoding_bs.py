import sys
f1 = open(sys.argv[1])
f2 = open(sys.argv[2], 'w', encoding='utf-8')
r1 = f1.readline()

while r1:
	f2.write(r1[2:-2] + '\n')
	r1 = f1.readline()
