# Literature Sentiment Visualizer

A dual-engine platform for mapping the emotional and phonetic DNA of classic literature. 

## 🛠 Tech Stack
- **Backend:** Python (NLTK/VADER, NetworkX, Requests)
- **Frontend:** JavaScript (p5.js, HTML5/CSS3)

## 📦 Quick Start

1. **Install Dependencies:**
   ```bash
   pip install nltk networkx requests

2. Generate Data:

   ```bash
   python main.py

3. Launch App:
Use VS Code Live Server or run:

   ```bash
   python -m http.server 5500

Main View: index.html
Comparison Hub: compare.html

**📊 Data Schema**
sentiment: Compound polarity (-1.0 to 1.0)
wordLength: Average characters per word (Prose Weight)
syllableDensity: Average syllables per word (Phonetic Rhythm)
preview: Contextual snippet centered on emotional triggers
weightedWords: The top 5 words driving the sentiment score

**📜 License**
Apache License 2.0
