import os
import re

total = 0
missing_answer = 0
missing_example = 0
missing_faq = 0

configs_dir = "src/tools/configs"

for f in os.listdir(configs_dir):
    if not f.endswith(".ts"): continue
    
    with open(os.path.join(configs_dir, f), "r") as file:
        content = file.read()
    
    # Split by "{ kind:" or similar block to find each tool
    blocks = re.split(r'\{\s*kind:\s*["\'][^"\']+["\']', content)[1:]
    total += len(blocks)
    
    for block in blocks:
        # get slug
        slug_match = re.search(r'slug:\s*["\']([^"\']+)["\']', block)
        slug = slug_match.group(1) if slug_match else "unknown"
        
        if 'directAnswer:' not in block:
            print(f"[Missing Answer] {slug}")
            missing_answer += 1
            
        if 'example:' not in block:
            print(f"[Missing Example] {slug}")
            missing_example += 1
            
        # Count FAQ questions
        faq_section = re.search(r'faq:\s*\[(.*?)\]\s*,?\s*(?:related:|export|})', block, re.DOTALL)
        if faq_section:
            qs = len(re.findall(r'question:', faq_section.group(1)))
            if qs < 4:
                print(f"[Missing/Short FAQ] {slug} ({qs})")
                missing_faq += 1
        else:
            print(f"[Missing/Short FAQ] {slug} (0)")
            missing_faq += 1

print(f"Total tools: {total}")
print(f"Missing Direct Answer: {missing_answer}")
print(f"Missing Example: {missing_example}")
print(f"Missing/Short FAQ: {missing_faq}")
