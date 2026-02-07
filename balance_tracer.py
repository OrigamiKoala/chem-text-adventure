
import sys

def trace_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    b_stack = []
    p_stack = []
    br_stack = []
    
    state = "NORMAL"
    i = 0
    while i < len(content):
        char = content[i]
        if state == "NORMAL":
            if char == '{': b_stack.append(i)
            elif char == '}': 
                if b_stack: b_stack.pop()
                else: print(f"Extra }} at {i}")
            elif char == '(': p_stack.append(i)
            elif char == ')':
                if p_stack: p_stack.pop()
                else: print(f"Extra ) at {i}")
            elif char == '[': br_stack.append(i)
            elif char == ']':
                if br_stack: br_stack.pop()
                else: print(f"Extra ] at {i}")
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

    print(f"Unbalanced Braces: {len(b_stack)}")
    print(f"Unbalanced Parens: {len(p_stack)}")
    print(f"Unbalanced Brackets: {len(br_stack)}")

trace_balance('/Users/carlliu/chem-text-adventure/game.js')
