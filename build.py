import glob
parts=sorted(glob.glob('work/*.js'))
open('index.html','w',encoding='utf-8').write(''.join(open(p,encoding='utf-8').read() for p in parts))
