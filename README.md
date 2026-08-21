# 💡 Smart India Hackathon (SIH) 2026 Problem Statement Research Explorer & Dataset

[![SIH 2026 Live Portal](https://img.shields.io/badge/Live_Portal-sih26ps.vercel.app-blue?style=for-the-badge&logo=vercel)](https://sih26ps.vercel.app)
[![Total Problem Statements](https://img.shields.io/badge/Total_Statements-226-emerald?style=for-the-badge)](https://sih26ps.vercel.app)
[![Software](https://img.shields.io/badge/Software-172-3B82F6?style=for-the-badge)](https://sih26ps.vercel.app)
[![Hardware](https://img.shields.io/badge/Hardware-54-10B981?style=for-the-badge)](https://sih26ps.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Interactive exploration portal, multi-tag search, automated data cleaning pipeline, and comprehensive JSON/CSV dataset for all **226 Problem Statements** released for the [Smart India Hackathon 2026 (SIH 2026)](https://sih.gov.in/sih2026PS).

---

## 🌐 Live Research Portal

Access the live interactive application at:
👉 **[https://sih26ps.vercel.app](https://sih26ps.vercel.app)**

- **Decoupled Search Bar**: Instantly filter across keywords, title, description, ministry, or specific problem statement IDs (e.g. `SIH26001`).
- **Multi-Select Technology Tags**: Combine tags like `AI / ML`, `Computer Vision`, `NLP / LLM`, `GIS / Satellite`, `IoT / Sensors`, `Blockchain`, `Robotics & UAV`, `Cybersecurity`, and more.
- **Spec-Compliant Markdown**: Formatted via `marked.js` and `DOMPurify` with proper sub-bullet nesting and typography.
- **1-Click Markdown Copy**: Instant clipboard export of structured problem statements in GitHub-Flavored Markdown.
- **Clean Dataset Export**: Export filtered or selected problem statements in clean JSON and CSV without scraper bloat.

---

## 📊 Dataset Overview & Statistics

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

```text
├── index.html                        # Modern Flat Design web portal (HTML5 + JSON-LD Schema)
├── style.css                         # High-contrast CSS system tokens & responsive layouts
├── app.js                            # Search, multi-tag filter engine, and modal controller
├── sih2026_problem_statements.json   # Cleaned & normalized JSON dataset (226 statements)
├── sih2026_problem_statements.csv    # Cleaned CSV export for data analysis & Excel
├── scrape_sih.py                     # Canonical scraper & data normalizer
├── logo.png                          # Official SIH logo
├── favicon.ico / favicon-*.png       # Multi-resolution favicons
├── package.json                      # Project metadata
└── README.md                         # Documentation
```

---

## 🚀 Quick Start

### 1. Launch the Web Explorer Locally
Serve the repository with any local HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Or with Node.js
npx serve .
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### 2. Run the Data Pipeline & Cleaner

```bash
# Clean & normalize the local dataset
python3 scrape_sih.py --clean-only

# Or fetch and parse directly from the official portal
python3 scrape_sih.py
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
  "modal_id": "ViewProblemStatement26001",
  "web_url": "https://sih.gov.in/sih2026PS#ViewProblemStatement26001"
}
```

---

## 📦 Clean Export Schema

When exporting selected or filtered statements via the **Download / Export** menu, the JSON format produces a clean schema without scraper bloat:

```json
{
  "id": "SIH26158",
  "title": "Single-Pass Drone Video to Accurate 3D Model Generation System",
  "category": "Software",
  "theme": "Robotics and Drones",
  "organization": "National Technical Research Organisation (NTRO)",
  "department": "National Technical Research Organisation (NTRO)",
  "submissions": "0/500",
  "deadline": "20 September 2026",
  "official_url": "https://sih.gov.in/sih2026PS#ViewProblemStatement26158",
  "description": "...",
  "dataset_info": "...",
  "external_links": [],
  "sections": { ... }
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

- **Flat Design System**: High-contrast, card-based interface with geometric typography (`Outfit` sans-serif & `JetBrains Mono`).
- **Mobile Responsive**: Slide-out filter drawer, sticky action bar, and responsive modal actions.
- **Search Scopes**: Filter across Full Text, Title Only, Description & Solution, Organization, or Problem ID.
- **12 Tech Tag Pills**: AI/ML, Computer Vision, NLP/LLM, GIS/Satellite, IoT, Blockchain, Robotics, Mobile Apps, Cloud, HealthTech, AgriTech, Cybersecurity.
- **1-Click Copy as MD**: Copies the problem statement as a formatted GitHub markdown document with metadata table and sections.
- **Clean Export Engine**: Export filtered or selected subsets to JSON and CSV with sanitized fields.
- **Problem Detail Modal**: Tabbed view featuring Full Description, Structured Sections, and Datasets & References.
