fos = ['biology','chemistry','psychology','computer science','physics','environmental science','medicine','mathematics','social science','business','materials science','engineering','humanities']

import sys

def do_check():
	f = open(sys.argv[1])
	r = f.readline()
	while r:
		okay = False
		if r == 'n\n':
			r = f.readline()
			continue
		for field in fos:
			if field in r:
				okay = True
				break
		if not okay:
			print(r, end='')
		r = f.readline()


if __name__ == '__main__':
	do_check()



