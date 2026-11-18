import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'

def gate_hover(css):
    """Wrap every top-level rule whose selector uses :hover in a hover-capable media query,
    so taps on phones never leave a stuck hover state."""
    out, i, n, depth, start = [], 0, len(css), 0, 0
    blocks = []
    buf_start = 0
    while i < n:
        c = css[i]
        if c == '/' and css[i:i+2] == '/*':
            j = css.find('*/', i + 2); i = (j + 2) if j >= 0 else n; continue
        if c == '{':
            if depth == 0: sel_start = buf_start
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                blocks.append(css[buf_start:i + 1]); buf_start = i + 1
        i += 1
    tail = css[buf_start:]
    res = []
    for b in blocks:
        head = b[:b.find('{')]
        if ':hover' in head and not head.strip().startswith('@'):
            res.append('\n@media (hover: hover) and (pointer: fine) {' + b + '}')
        else:
            res.append(b)
    return ''.join(res) + tail

html = (src / 'index.html').read_text()
css = gate_hover((src / 'styles.css').read_text())
js = '\n'.join(p.read_text() for p in sorted((src / 'js').glob('*.js')))
out = html.replace('/*CSS*/', css).replace('/*JS*/', js)
(root / 'index.html').write_text(out)
print('built index.html', len(out), 'bytes')
