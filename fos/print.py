import sys

f = open(sys.argv[1], 'r')
counter = 0
r = f.readline()
while r:
    print(r)
    r = f.readline()
print(counter)
