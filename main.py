import os
import re
import json
import requests
import networkx as nx
import nltk
from nltk.tokenize import RegexpTokenizer 
from nltk.sentiment.vader import SentimentIntensityAnalyzer

nltk.download('vader_lexicon', quiet=True)
sia = SentimentIntensityAnalyzer()
tokenizer = RegexpTokenizer(r'\w+')

def get_text(url, path):
    if not os.path.exists(path):
        r = requests.get(url)
        raw = r.text
        start = raw.find("*** START OF")
        end = raw.find("*** END OF")
        body = raw[raw.find("\n", start + 50):end].strip() if start != -1 else raw
        with open(path, 'w', encoding='utf-8') as f:
            f.write(body)
    return path

def syl_count(word):
    word = word.lower()
    vowels = len(re.findall(r'[aeiouy]+', word))
    if word.endswith('e'): vowels -= 1
    return max(1, vowels)

def get_keywords(text, sentiment, n=3):
    tokens = tokenizer.tokenize(text.lower())
    scores = {}
    for w in tokens:
        if w in sia.lexicon:
            v = sia.lexicon[w]
            if (sentiment > 0.05 and v > 0) or (sentiment < -0.05 and v < 0):
                scores[w] = abs(v)
    return [k for k, v in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]]

def get_preview(chunk, word, size=220):
    m = re.search(r'\b' + re.escape(word) + r'\b', chunk, re.I)
    if m:
        start = max(0, m.start() - (size // 2))
        end = min(len(chunk), m.start() + (size // 2))
        return f"{'...' if start > 0 else ''}{chunk[start:end].strip()}{'...' if end < len(chunk) else ''}"
    return chunk[:size] + "..."

def analyze(path, out_path, chunk_size=750, bolds=5):
    with open(path, 'r', encoding='utf-8') as f:
        full = f.read().split()
    
    chunks = [" ".join(full[i:i + chunk_size]) for i in range(0, len(full), chunk_size)]
    G = nx.DiGraph()
    prev = None
    
    for i, c in enumerate(chunks):
        score = sia.polarity_scores(c)['compound']
        keys = get_keywords(c, score, n=bolds)
        
        tokens = tokenizer.tokenize(c)
        if tokens:
            avg_len = sum(len(w) for w in tokens) / len(tokens)
            syllables = sum(syl_count(w) for w in tokens) / len(tokens)
        else:
            avg_len, syllables = 0, 0

        preview = get_preview(c, keys[0]) if keys else c[:220] + "..."
            
        node_id = f"beat_{i}"
        G.add_node(node_id, 
                   index=i, 
                   sentiment=score, 
                   preview=preview, 
                   weightedWords=keys,
                   wordLength=avg_len,
                   syllableDensity=syllables)
        
        if prev: G.add_edge(prev, node_id)
        prev = node_id

    # Save to the specific path expected by compare.js
    with open(out_path, 'w') as f:
        json.dump(nx.node_link_data(G), f, indent=4)
    print(f"Exported: {out_path}")

if __name__ == "__main__":
    # Define the books and their specific output names
    books = [
        {
            "url": "https://www.gutenberg.org/cache/epub/64317/pg64317.txt", 
            "src": "gatsby.txt", 
            "out": "gatsby.json"
        },
        {
            "url": "https://www.gutenberg.org/cache/epub/84/pg84-0.txt", 
            "src": "frankenstein.txt", 
            "out": "frankenstein.json"
        }
    ]
    
    for b in books:
        f = get_text(b["url"], b["src"])
        analyze(f, b["out"])