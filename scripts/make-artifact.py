"""Assembles dist-artifact/leadwell.html: a single self-contained page (inline CSS + JS) for sandboxed hosting.

The output is pure ASCII. Every non-ASCII character is written as an escape sequence, so the page
renders correctly even if a host serves it without a UTF-8 charset (which otherwise turns "·" into "Â·").
"""
import glob


def js_escape(text: str) -> str:
    out = []
    for ch in text:
        cp = ord(ch)
        if cp < 128:
            out.append(ch)
        elif cp <= 0xFFFF:
            out.append('\\u%04x' % cp)
        else:  # astral plane: UTF-16 surrogate pair
            cp -= 0x10000
            out.append('\\u%04x\\u%04x' % (0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)))
    return ''.join(out)


def css_escape(text: str) -> str:
    return ''.join(ch if ord(ch) < 128 else '\\%x ' % ord(ch) for ch in text)


css = css_escape(open(glob.glob('dist-artifact/assets/*.css')[0], encoding='utf-8').read())
js = js_escape(open(glob.glob('dist-artifact/assets/*.js')[0], encoding='utf-8').read())
js = js.replace('</script', '<\\/script')
css = css.replace('</style', '<\\/style')

page = f'''<title>LeadWell</title>
<meta charset="utf-8">
<meta name="description" content="LeadWell: The Difficult Conversations Lab, a branching leadership conversation simulator.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<style>{css}</style>
<div id="root"></div>
<script type="module">{js}</script>
'''
assert page.isascii(), 'artifact page must be ASCII-only'
open('dist-artifact/leadwell.html', 'w', encoding='ascii').write(page)
print(f'wrote dist-artifact/leadwell.html ({len(page):,} bytes, ASCII-only)')
