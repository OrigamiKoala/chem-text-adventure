
import sys

with open('/Users/carlliu/chem-text-adventure/game.js', 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for j, char in enumerate(line):
        if char == '{':
            stack.append((i + 1, j + 1))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing brace at line {i + 1}, col {j + 1}")

for line, col in stack:
    print(f"Unmatched opening brace at line {line}, col {col}")
