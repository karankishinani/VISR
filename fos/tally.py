import sys
from collections import Counter

f = open(sys.argv[1], 'r')
r = f.readline()
tally = Counter()
while r:
    if r[0] == 'y':
        fields = r[3:-2]
        # split fields
        s_f = fields.split(',')
        for field in s_f:
            if field in tally:
                tally[field] = tally[field] + 1
            else:
                tally[field] = 1
    r = f.readline()

print(tally.most_common(30))
