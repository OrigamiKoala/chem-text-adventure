
import sys

def count_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()

    state = "NORMAL"
    open_braces = 0
    close_braces = 0
    i = 0
    n = len(content)
    
    while i < n:
        char = content[i]
        
        if state == "NORMAL":
            if char == '{':
                open_braces += 1
            elif char == '}':
                close_braces += 1
            elif char == '"':
                state = "STRING_DOUBLE"
            elif char == "'":
                state = "STRING_SINGLE"
            elif char == "`":
                state = "STRING_BACKTICK"
            elif char == "/" and i + 1 < n:
                if content[i+1] == "/":
                    state = "COMMENT_LINE"
                    i += 1
                elif content[i+1] == "*":
                    state = "COMMENT_BLOCK"
                    i += 1
                else:
                    # Potential regex
                    # This is hard to detect perfectly but for simple cases:
                    # If the previous non-whitespace was ( = , ; [ ? ! & |
                    # we can assume it might be a regex.
                    pass
        elif state == "STRING_DOUBLE":
            if char == '"' and content[i-1] != "\\":
                state = "NORMAL"
        elif state == "STRING_SINGLE":
            if char == "'" and content[i-1] != "\\":
                state = "NORMAL"
        elif state == "STRING_BACKTICK":
            if char == "`" and content[i-1] != "\\":
                state = "NORMAL"
        elif state == "COMMENT_LINE":
            if char == "\n":
                state = "NORMAL"
        elif state == "COMMENT_BLOCK":
            if char == "*" and i + 1 < n and content[i+1] == "/":
                state = "NORMAL"
                i += 1
        
        i += 1
    
    return open_braces, close_braces

open_b, close_b = count_braces('/Users/carlliu/chem-text-adventure/game.js')
print(f"Braces: {open_b} open, {close_b} close")
print(f"Difference: {open_b - close_b}")
