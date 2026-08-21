# SIH 2026 Problem Statement Research Explorer & Scraper

An automated scraping pipeline, dataset repository, and responsive web explorer for all **226 Problem Statements** from the [Smart India Hackathon 2026 (SIH 2026)](https://sih.gov.in/sih2026PS).

---

## 📊 Dataset Overview

- **Source URL**: `https://sih.gov.in/sih2026PS`
- **Total Problem Statements**: 226 (`SIH26001` – `SIH26226`)
- **Primary Category Breakdown**:
  - **Software**: 172
  - **Hardware**: 54
- **Top Themes**:
  - Miscellaneous (38)
  - Smart Automation (31)
  - Disaster Management (29)
  - Blockchain & Cybersecurity (22)
  - MedTech / BioTech / HealthTech (14)
  - Smart Education (13)
  - Agriculture, FoodTech & Rural Development (12)
  - Space Technology (11)
  - Robotics and Drones (10)
  - Transportation & Logistics (8)
- **Top Ministries / Organizations**:
  - AICTE (34)
  - Ministry of Earth Sciences / MoES (30)
  - National Technical Research Organisation / NTRO (23)
  - ISRO (11)
  - Ministry of Home Affairs (11)
  - Ministry of Rural Development (10)
  - Ministry of Consumer Affairs, Food & Public Distribution (10)
  - Government of Maharashtra (9)
  - Ministry of Social Justice and Empowerment / MoSJE (8)
  - DRDO (7)

---

## 📁 Repository Structure

```
├── sih2026_problem_statements.json  # Complete structured JSON dataset (1.6 MB)
├── sih2026_problem_statements.csv   # Tabular CSV export (640 KB)
├── index.html                       # Flat design web portal (HTML5)
├── style.css                        # Strict Flat Design styling & responsive CSS
├── app.js                           # Real-time search, filters, exports, modal logic
├── scrape_sih.py                    # Standalone Python scraper (BeautifulSoup + Requests)
├── scrape_sih.js                    # Node.js scraper (Axios + Cheerio)
├── scrape_puppeteer.js              # Headless browser scraper (Puppeteer)
├── package.json                     # Node.js dependencies
└── README.md                        # Documentation
```

---

## 🚀 Quick Start

### 1. Launch the Web Explorer
Serve the directory with any static HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Or with Node.js
npx serve .
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### 2. Run the Scrapers (Optional / Re-scraping)

**Using Python**:
```bash
pip install beautifulsoup4 requests
python3 scrape_sih.py
```

**Using Node.js (Axios/Cheerio)**:
```bash
npm install
node scrape_sih.js
```

**Using Puppeteer**:
```bash
node scrape_puppeteer.js
```

---

## 🔍 JSON Schema Format

Each problem statement entry in `sih2026_problem_statements.json`:

```json
{
  "id": "SIH26001",
  "numeric_id": 26001,
  "serial_no": 1,
  "title": "AI-Based early warning and landslide Risk Monitoring System in NER",
  "organization": "Ministry of Development of North Eastern Region (MDoNER)",
  "department": "Ministry of Development of North Eastern Region (MDoNER)",
  "category": "Software",
  "theme": "Disaster Management",
  "submitted_ideas": {
    "count": 0,
    "capacity": 500,
    "raw": "0/500"
  },
  "deadline": "20 September 2026",
  "youtube_link": null,
  "dataset_info": null,
  "contact_info": null,
  "external_links": [],
  "sections": {
    "background": {
      "title": "Background",
      "content": "The North Eastern Region (NER) frequently faces landslides..."
    },
    "description": {
      "title": "Description",
      "content": "This problem statement proposes the development of..."
    },
    "expected_solution": {
      "title": "Expected Solution",
      "content": "A scalable AI-based software platform with..."
    }
  },
  "description": "**Background:**\n\nThe North Eastern Region (NER) frequently faces landslides...",
  "description_html": "<div class=\"style-2\" ...>...</div>",
  "modal_id": "ViewProblemStatement26001",
  "web_url": "https://sih.gov.in/sih2026PS#ViewProblemStatement26001"
}
```

---

## 🐍 Loading the Dataset in Python

```python
import json
import pandas as pd

# Load JSON
with open('sih2026_problem_statements.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

problem_statements = data['problem_statements']
print(f"Loaded {len(problem_statements)} problem statements")

# Convert to Pandas DataFrame
df = pd.DataFrame(problem_statements)

# Filter for AI/ML related statements
ai_statements = [
    p for p in problem_statements 
    if 'AI' in p['title'] or 'machine learning' in p['description'].lower()
]
print(f"Found {len(ai_statements)} AI/ML statements")
```

---

## 🎨 Web Explorer Features

- **Flat Design System**: Zero drop shadows, bold color blocking, and geometric typography (`Outfit` sans-serif & `JetBrains Mono`).
- **Mobile Responsive**: Slide-out filter drawer, sticky action bar, and responsive touch controls.
- **Search Scopes**: Filter across Full Text, Title Only, Description & Solution, Organization, or Problem ID.
- **12 Tech Tag Pills**: AI/ML, Computer Vision, NLP/LLM, GIS/Satellite, IoT, Blockchain, Robotics, Mobile Apps, Cloud, HealthTech, AgriTech, Cybersecurity.
- **Export Formats**: Filtered / Selected export as `.json` or `.csv`, and 1-click clipboard copy.
- **Problem Modal**: Tabbed view with full formatted description, structured sections, datasets, external links, and raw JSON inspector.
