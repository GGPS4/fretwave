import pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
html = (src / 'index.html').read_text()
css = (src / 'styles.css').read_text()
js = '\n'.join(p.read_text() for p in sorted((src / 'js').glob('*.js')))
out = html.replace('/*CSS*/', css).replace('/*JS*/', js)
(root / 'index.html').write_text(out)
print('built index.html', len(out), 'bytes')
