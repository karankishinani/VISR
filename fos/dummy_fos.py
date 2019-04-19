f = open('simplified_fieldsX3.txt', 'r')
r = f.readline()

while r:
	items = r[:-1].split(',')
	if len(items) > 2:
		print(items)
	r = f.readline()
