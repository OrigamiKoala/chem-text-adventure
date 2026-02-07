
import sys

def trace_open_blocks(filename):
    with open(filename, 'r') as f:
        content = f.read()

    stack = []
    state = "NORMAL"
    i = 0
    while i < len(content):
        char = content[i]
        if state == "NORMAL":
            if char == '{': stack.append(('{', i))
            elif char == '}': 
                if stack and stack[-1][0] == '{': stack.pop()
            elif char == '(': stack.append(('(', i))
            elif char == ')':
                if stack and stack[-1][0] == '(': stack.pop()
            elif char == '[': stack.append(('[', i))
            elif char == ']':
                if stack and stack[-1][0] == '[': stack.pop()
            elif char == '"': state = "STRING_Q"
            elif char == "'": state = "STRING_S"
            elif char == "`": state = "STRING_B"
            elif char == "/" and i+1 < len(content):
                if content[i+1] == "/": state = "COMMENT_L"; i += 1
                elif content[i+1] == "*": state = "COMMENT_B"; i += 1
        elif state == "STRING_Q":
            if char == '"' and content[i-1] != "\\": state = "NORMAL"
        elif state == "STRING_S":
            if char == "'" and content[i-1] != "\\": state = "NORMAL"
        elif state == "STRING_B":
            if char == "`" and content[i-1] != "\\": state = "NORMAL"
        elif state == "COMMENT_L":
            if char == "\n": state = "NORMAL"
        elif state == "COMMENT_B":
            if char == "*" and i+1 < len(content) and content[i+1] == "/": state = "NORMAL"; i += 1
        i += 1

    # Get line numbers
    lines = content.split('\n')
    line_offsets = [0]
    for l in lines:
        line_offsets.append(line_offsets[-1] + len(l) + 1)

    print("Open blocks at end of file:")
    for type, offset in stack:
        line_no = 0
        for idx, loff in enumerate(line_offsets):
            if offset < loff:
                line_no = idx
                break
        print(f"{type} at line {line_no}")

trace_open_blocks('/Users/carlliu/chem-text-adventure/game.js')
