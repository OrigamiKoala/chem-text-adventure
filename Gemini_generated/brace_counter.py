
import sys

with open('/Users/carlliu/chem-text-adventure/game.js', 'r') as f:
    content = f.read()

open_braces = 0
close_braces = 0
open_parens = 0
close_parens = 0

for i, char in enumerate(content):
    if char == '{': open_braces += 1
    elif char == '}': close_braces += 1
    elif char == '(': open_parens += 1
    elif char == ')': close_parens += 1

print(f"Braces: {open_braces} open, {close_braces} close")
print(f"Parens: {open_parens} open, {close_parens} close")
