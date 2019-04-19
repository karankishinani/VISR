import sys

fields=['medicine','biology','physics','chemistry','engineering','computer science','psychology','mathematics','social science','environmental science','materials science','business','humanities']

f = open(sys.argv[1])
r = f.readline()

while r:
	okay = False
	for field in fields:
		if field in r:
			okay = True
			print(r[:-1])
			break
	if not okay:
		print('n')
	r = f.readline()
