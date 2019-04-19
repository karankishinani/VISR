import sys

f = open(sys.argv[1], 'r')
counter = 0
r = f.readline()
while r:
    counter += 1
    r = f.readline()
print(counter)
