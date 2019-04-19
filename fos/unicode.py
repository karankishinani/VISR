import sys

f1 = open(sys.argv[1], 'r', encoding='utf-16')
r1 = f1.readline()
f2 = open(sys.argv[2], 'w', encoding='utf-16')

while r1:
	s = r1.encode('utf-16').decode('latin-1')
	f2.write(s[:-1])
	r1 = f1.readline()
