#!/usr/bin/env python3
"""
SIH 2026 Problem Statement Scraper & Parser
============================================
Fetches all 226 problem statements and their comprehensive modal details from 
https://sih.gov.in/sih2026PS and exports them to structured JSON and CSV formats.
"""

import urllib.request
import json
import csv
import re
import html as html_module
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import os

def fix_mojibake(text: str) -> str:
    """Fix common Windows-1252 / UTF-8 encoding artifacts (mojibake)."""
    if not text:
        return ""
    replacements = {
        'â€™': "'",
        'â€˜': "'",
        'â€œ': '"',
        'â€\x9d': '"',
        'â€\x9c': '"',
        'â€ ': '"',
        'â€”': '—',
        'â€“': '–',
        'â€¢': '•',
        'â€¦': '…',
        'Â': '',
        'â„¢': '™',
        'â‰¥': '≥',
        'â‰¤': '≤',
        'â‰ˆ': '≈',
        'â‰ ': '≠',
        'âˆž': '∞',
        'âˆš': '√',
        'â†’': '→',
        'â†': '←',
        'â‡’': '⇒',
        'â€': '',
        'â€‹': '',
        '\xa0': ' ',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def extract_urls(text: str) -> list[str]:
    """Extract unique HTTP/HTTPS URLs from text."""
    if not text:
        return []
    url_pattern = r'https?://[^\s()<>]+[^\s`!()\[\]{};:\'\".,<>?«»“”‘’]'
    urls = list(set(re.findall(url_pattern, text)))
    return sorted(urls)

def fix_punctuation_spacing(text: str) -> str:
    """Fix missing spaces after punctuation without breaking common abbreviations."""
    if not text:
        return ''
    
    # 1. Abbreviations stuck to following words: e.g.Word, etc.Word -> etc. Word
    text = re.sub(r'\b(e\.g\.|i\.e\.|etc\.)([A-Za-z])', r'\1 \2', text)
    
    # 2. General sentence boundaries: word.NextWord -> word. NextWord
    def period_repl(m):
        prefix = m.group(1)
        next_char = m.group(2)
        if prefix.lower() in {'dr', 'mr', 'mrs', 'ms', 'prof', 'govt', 'inc', 'ltd', 'u.s', 'no', 'vs'} and next_char.islower():
            return f"{prefix}.{next_char}"
        return f"{prefix}. {next_char}"
    
    text = re.sub(r'(\b[a-zA-Z0-9%]+)\.([A-Z][a-zA-Z])', period_repl, text)
    # Comma spacing: word,word -> word, word
    text = re.sub(r'([a-zA-Z0-9]),([a-zA-Z])', r'\1, \2', text)
    # Parenthesis spacing: word(e.g. -> word (e.g.
    text = re.sub(r'([a-zA-Z0-9])\(([a-zA-Z0-9])', r'\1 (\2', text)
    # Closing parenthesis spacing: )word -> ) word
    text = re.sub(r'\)([a-zA-Z])', r') \1', text)
    
    return text

def clean_problem_description(text: str) -> tuple[str, str]:
    """Clean markdown text, normalize headers, fix inlined lists and missing spaces."""
    if not text:
        return '', ''
    
    # 1. Unescape HTML entities & clean mojibake
    text = html_module.unescape(text)
    text = fix_mojibake(text)
    
    # 2. Strip HTML comments and tags
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'</?(?:div|span|p|br|table|tr|td|th)[^>]*>', '\n', text, flags=re.IGNORECASE)
    
    # 3. Fix typographic punctuation spacing
    text = fix_punctuation_spacing(text)
    
    # 4. Standardize and Demarcate Section Headers
    section_patterns = [
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Background\b[:\-—\s]*', '\n\n**Background:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Problem Description\b[:\-—\s]*', '\n\n**Problem Description:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Detailed Description\b[:\-—\s]*', '\n\n**Problem Description:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Problem Statement\b[:\-—\s]*', '\n\n**Problem Statement:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Problem Definition\b[:\-—\s]*', '\n\n**Problem Definition:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Existing Problem\b[:\-—\s]*', '\n\n**Existing Problem:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Expected Outcome/Solution\b[:\-—\s]*', '\n\n**Expected Outcome / Solution:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Expected Solution/Deliverables\b[:\-—\s]*', '\n\n**Expected Solution / Deliverables:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Expected Outcomes?\b[:\-—\s]*', '\n\n**Expected Outcome:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Expected Solution\b[:\-—\s]*', '\n\n**Expected Solution:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Desired Outcomes?\b[:\-—\s]*', '\n\n**Desired Outcome:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Proposed Solution\b[:\-—\s]*', '\n\n**Proposed Solution:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Relevant Data Availability\s*(?:\(if any\))?[:\-—\s]*', '\n\n**Relevant Data Availability:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Dataset Availability\b[:\-—\s]*', '\n\n**Dataset Availability:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Dataset Details?\b[:\-—\s]*', '\n\n**Dataset Details:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Input Data\b[:\-—\s]*', '\n\n**Input Data:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Scope of Work\b[:\-—\s]*', '\n\n**Scope of Work:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Key Deliverables\b[:\-—\s]*', '\n\n**Key Deliverables:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Deliverables?\b[:\-—\s]*', '\n\n**Deliverables:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Objectives?\b[:\-—\s]*', '\n\n**Objectives:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Key Features\b[:\-—\s]*', '\n\n**Key Features:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Technical Requirements\b[:\-—\s]*', '\n\n**Technical Requirements:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Hardware & Runtime Environment\b[:\-—\s]*', '\n\n**Hardware & Runtime Environment:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Evaluation Criteria\b[:\-—\s]*', '\n\n**Evaluation Criteria:**\n'),
        (r'(?:\n|^|\.\s+)(?:[•\-*]\s*)?Success Criteria\b[:\-—\s]*', '\n\n**Success Criteria:**\n')
    ]
    
    for pattern, replacement in section_patterns:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
    # 5. Format inline list items (a) ... b) ... c) ... or 1. ... 2. ... 3. ...)
    text = re.sub(r'(?:^|[\n\s]+)([a-d]\))\s+([A-Z])', r'\n- **\1** \2', text)
    text = re.sub(r'(?:^|[\n\s]+)(\([a-d]\))\s+([A-Z])', r'\n- **\1** \2', text)
    text = re.sub(r'(?:^|[\n\s]+)(\([i|v|x]+\))\s+([A-Z])', r'\n- **\1** \2', text)
    
    # 6. Normalize list bullets on lines
    cleaned_lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            cleaned_lines.append('')
            continue
            
        # Clean double bullets or weird bullet chars
        line = re.sub(r'^(?:[•·â€¢]\s*)+', '- ', line)
        line = re.sub(r'^[oO]\s+(?=[A-Z])', '- ', line)
        line = re.sub(r'^-\s*[•·â€¢]\s*', '- ', line)
        line = re.sub(r'^\*\s*(?!\*)', '- ', line)
        
        # If line is a header like '- **Background:**' -> remove bullet
        line = re.sub(r'^-\s*(\*\*[^*]+:\*\*)$', r'\1', line)
        
        cleaned_lines.append(line)
        
    result = '\n'.join(cleaned_lines)
    result = re.sub(r'\n{3,}', '\n\n', result).strip()
    
    # Extract dataset availability if present in text
    extracted_data_info = ''
    data_match = re.search(r'\*\*(?:Relevant Data Availability|Dataset Availability|Dataset Details|Input Data):\*\*\s*\n*(.*?)(?=\n\n\*\*|\Z)', result, flags=re.DOTALL)
    if data_match:
        extracted_data_info = data_match.group(1).strip()
        
    return result, extracted_data_info

def clean_html_to_markdown(raw_input) -> str:
    """Convert HTML content element to clean, formatted Markdown."""
    if raw_input is None:
        return ""
    
    if hasattr(raw_input, 'contents'):
        s = ''.join(str(c) for c in raw_input.contents)
    else:
        s = str(raw_input)
        
    # Unescape HTML entities if double encoded (e.g. &lt;b&gt; -> <b>)
    if '&lt;' in s and '&gt;' in s:
        s = html_module.unescape(s)
        
    # Remove outer div wrappers
    s = re.sub(r'^<div[^>]*>', '', s.strip())
    s = re.sub(r'</div>$', '', s.strip())
    
    # Replace breaks and paragraph tags with newlines
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'</p>', '\n\n', s)
    s = re.sub(r'<p[^>]*>', '', s)
    
    sub_soup = BeautifulSoup(s, 'html.parser')
    
    # Format headings and bold tags
    for b in sub_soup.find_all(['b', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u']):
        txt = b.get_text()
        if txt.strip():
            b.replace_with(f' **{txt.strip()}** ')
            
    # Format anchor links
    for a in sub_soup.find_all('a'):
        href = a.get('href', '').strip()
        txt = a.get_text(strip=True)
        if href and href != '#':
            if txt and txt != href:
                a.replace_with(f' [{txt}]({href}) ')
            else:
                a.replace_with(f' {href} ')
                
    text = sub_soup.get_text()
    cleaned, _ = clean_problem_description(text)
    return cleaned

def parse_sections(markdown_text: str) -> dict:
    """
    Parses structured sections out of markdown description.
    Looks for headers like **Background:**, **Description:**, **Expected Solution:**, etc.
    """
    sections = {}
    if not markdown_text:
        return sections
    
    header_pattern = r'(?:\n|^)\s*\*\*([A-Za-z0-9\s/&,._\-()]+?):\*\*\s*'
    parts = re.split(header_pattern, '\n' + markdown_text)
    
    if len(parts) >= 3:
        if parts[0].strip():
            sections['overview'] = {
                'title': 'Overview',
                'content': parts[0].strip()
            }
            
        for i in range(1, len(parts), 2):
            raw_title = parts[i].strip()
            sec_name = raw_title.lower()
            sec_name = re.sub(r'[^a-z0-9]+', '_', sec_name).strip('_')
            sec_val = parts[i+1].strip() if i+1 < len(parts) else ''
            sections[sec_name] = {
                'title': raw_title,
                'content': sec_val
            }
    else:
        sections['full_description'] = {
            'title': 'Full Description',
            'content': markdown_text.strip()
        }
    return sections

def scrape_sih_problem_statements(
    url: str = "https://sih.gov.in/sih2026PS",
    output_json: str = "sih2026_problem_statements.json",
    output_csv: str = "sih2026_problem_statements.csv"
):
    print(f"Fetching data from {url}...")
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    )
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw_html = resp.read().decode('utf-8', errors='replace')
        
    print(f"HTML retrieved ({len(raw_html)} characters). Parsing DOM...")
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    main_table = soup.find('table', {'id': 'dataTablePS'})
    if not main_table:
        raise ValueError("Could not find table #dataTablePS in the HTML page")
        
    tbody = main_table.find('tbody')
    rows = tbody.find_all('tr', recursive=False)
    print(f"Found {len(rows)} table rows in the DOM.")
    
    problem_statements = []
    
    for idx, r in enumerate(rows):
        tds = r.find_all('td', recursive=False)
        if len(tds) < 8:
            continue
            
        s_no_raw = tds[0].get_text(strip=True)
        serial_no = int(s_no_raw) if s_no_raw.isdigit() else s_no_raw
        
        org_outer = fix_mojibake(tds[1].get_text(strip=True))
        
        title_a = tds[2].find('a')
        title_outer = fix_mojibake(title_a.get_text(strip=True) if title_a else '')
        
        category_outer = tds[3].get_text(strip=True)
        ps_id_outer = tds[4].get_text(strip=True)
        
        numeric_id_match = re.search(r'\d+', ps_id_outer)
        numeric_id = int(numeric_id_match.group(0)) if numeric_id_match else None
        
        sub_count_raw = tds[5].get_text(strip=True)
        sub_parts = sub_count_raw.split('/')
        sub_count = int(sub_parts[0]) if len(sub_parts) > 0 and sub_parts[0].isdigit() else 0
        sub_cap = int(sub_parts[1]) if len(sub_parts) > 1 and sub_parts[1].isdigit() else 500
        
        theme_outer = fix_mojibake(tds[6].get_text(strip=True))
        deadline_outer = tds[7].get_text(strip=True)
        
        # Parse Modal Details
        modal = r.find('div', class_='modal')
        modal_data = {}
        modal_id = modal.get('id') if modal else f"ViewProblemStatement{numeric_id or idx+1}"
        
        if modal:
            modal_table = modal.find('table')
            if modal_table:
                for mtr in modal_table.find_all('tr'):
                    mtds = mtr.find_all(['th', 'td'])
                    if len(mtds) >= 2:
                        k = mtds[0].get_text(strip=True)
                        val_div = mtds[1].find('div') or mtds[1]
                        raw_html_content = ''.join(str(c) for c in val_div.contents).strip()
                        val_text = val_div.get_text(separator=' ', strip=True)
                        val_text = fix_mojibake(html_module.unescape(val_text))
                        
                        a_links = [
                            a.get('href').strip() 
                            for a in mtds[1].find_all('a') 
                            if a.get('href') and a.get('href').strip() not in ['#', '']
                        ]
                        
                        modal_data[k] = {
                            'text': val_text,
                            'raw_html': raw_html_content,
                            'links': a_links,
                            'element': val_div
                        }
        
        desc_elem = modal_data.get('Description', {}).get('element')
        desc_raw_html = modal_data.get('Description', {}).get('raw_html', '')
        desc_md = clean_html_to_markdown(desc_elem) if desc_elem else ''
        
        department = modal_data.get('Department', {}).get('text', '') or org_outer
        
        youtube_raw = modal_data.get('Youtube Link', {}).get('text', '')
        youtube_link = youtube_raw if youtube_raw and youtube_raw.lower() not in ['', 'none', 'na', 'n/a'] else None
        
        dataset_link_raw = modal_data.get('Dataset Link', {}).get('text', '')
        dataset_elem = modal_data.get('Dataset Link', {}).get('element')
        dataset_info = clean_html_to_markdown(dataset_elem) if dataset_elem else dataset_link_raw
        if not dataset_info or dataset_info.lower() in ['', 'none', 'na', 'n/a']:
            dataset_info = None
            
        contact_info_raw = modal_data.get('Contact info', {}).get('text', '')
        contact_elem = modal_data.get('Contact info', {}).get('element')
        contact_info = clean_html_to_markdown(contact_elem) if contact_elem else contact_info_raw
        if not contact_info or contact_info.lower() in ['', 'none', 'na', 'n/a']:
            contact_info = None
            
        # Collect all external URLs
        all_urls = set()
        for u in extract_urls(desc_md):
            all_urls.add(u)
        if dataset_info:
            for u in extract_urls(dataset_info):
                all_urls.add(u)
        for k, v in modal_data.items():
            for lk in v.get('links', []):
                all_urls.add(lk)
                
        # Parse structured sections from description
        sections = parse_sections(desc_md)
        
        ps_obj = {
            "id": ps_id_outer,
            "numeric_id": numeric_id,
            "serial_no": serial_no,
            "title": title_outer,
            "organization": org_outer,
            "department": department,
            "category": category_outer,
            "theme": theme_outer,
            "submitted_ideas": {
                "count": sub_count,
                "capacity": sub_cap,
                "raw": sub_count_raw
            },
            "deadline": deadline_outer,
            "youtube_link": youtube_link,
            "dataset_info": dataset_info,
            "contact_info": contact_info,
            "external_links": sorted(list(all_urls)),
            "sections": sections,
            "description": desc_md,
            "description_html": desc_raw_html,
            "modal_id": modal_id,
            "web_url": f"{url}#{modal_id}"
        }
        problem_statements.append(ps_obj)
        
    # Aggregate statistics for research overview
    category_counts = {}
    theme_counts = {}
    org_counts = {}
    
    for ps in problem_statements:
        category_counts[ps['category']] = category_counts.get(ps['category'], 0) + 1
        theme_counts[ps['theme']] = theme_counts.get(ps['theme'], 0) + 1
        org_counts[ps['organization']] = org_counts.get(ps['organization'], 0) + 1
        
    dataset = {
        "metadata": {
            "source_url": url,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "total_problem_statements": len(problem_statements),
            "statistics": {
                "categories": category_counts,
                "themes": dict(sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)),
                "organizations": dict(sorted(org_counts.items(), key=lambda x: x[1], reverse=True))
            }
        },
        "problem_statements": problem_statements
    }
    
    # Save JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print(f"-> Successfully saved {len(problem_statements)} problem statements to {output_json}")
    
    # Save CSV for tabular research
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "PS ID",
            "Serial No",
            "Title",
            "Organization",
            "Department",
            "Category",
            "Theme",
            "Submitted Ideas Count",
            "Capacity",
            "Deadline",
            "Dataset Info",
            "YouTube Link",
            "External Links",
            "Description",
            "Web URL"
        ])
        for p in problem_statements:
            writer.writerow([
                p["id"],
                p["serial_no"],
                p["title"],
                p["organization"],
                p["department"],
                p["category"],
                p["theme"],
                p["submitted_ideas"]["count"],
                p["submitted_ideas"]["capacity"],
                p["deadline"],
                p["dataset_info"] or "",
                p["youtube_link"] or "",
                "; ".join(p["external_links"]),
                p["description"],
                p["web_url"]
            ])
    print(f"-> Successfully saved CSV export to {output_csv}")
    
    return dataset

def clean_existing_dataset(
    json_path: str = "sih2026_problem_statements.json",
    csv_path: str = "sih2026_problem_statements.csv"
):
    print(f"Reading {json_path} for normalization & cleaning...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    total = len(data['problem_statements'])
    cleaned_problems = []
    dataset_info_extracted = 0
    structured_sections_count = 0
    
    for p in data['problem_statements']:
        raw_desc = p.get('raw_description') or p['description']
        cleaned_desc, extracted_data = clean_problem_description(raw_desc)
        
        if 'raw_description' not in p:
            p['raw_description'] = raw_desc
        p['description'] = cleaned_desc
        
        if not p.get('dataset_info') and extracted_data and extracted_data.lower() not in ['none', 'n/a', 'nil', 'none.']:
            p['dataset_info'] = extracted_data
            dataset_info_extracted += 1
            
        secs = parse_sections(cleaned_desc)
        p['sections'] = secs
        if len(secs) > 1 or (len(secs) == 1 and 'full_description' not in secs):
            structured_sections_count += 1
            
        cleaned_problems.append(p)
        
    data['problem_statements'] = cleaned_problems
    data['metadata']['cleaned_at'] = datetime.now(timezone.utc).isoformat()
    data['metadata']['cleaning_engine'] = 'SIH-2026-Data-Normalizer-v2'
    data['metadata']['structured_sections_coverage'] = f"{structured_sections_count}/{total}"
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved cleaned JSON ({total} statements) to {json_path}")
    print(f"   - Structured sections parsed for {structured_sections_count}/{total} statements")
    print(f"   - Extracted dataset info for {dataset_info_extracted} statements")
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "PS ID", "Serial No", "Title", "Organization", "Department",
            "Category", "Theme", "Submitted Ideas Count", "Capacity", "Deadline",
            "Dataset Info", "YouTube Link", "External Links", "Description", "Web URL"
        ])
        for p in cleaned_problems:
            writer.writerow([
                p["id"],
                p.get("serial_no", ""),
                p["title"],
                p["organization"],
                p.get("department", ""),
                p["category"],
                p["theme"],
                p.get("submitted_ideas", {}).get("count", 0),
                p.get("submitted_ideas", {}).get("capacity", 500),
                p.get("deadline", ""),
                p.get("dataset_info") or "",
                p.get("youtube_link") or "",
                "; ".join(p.get("external_links", [])),
                p["description"],
                p.get("web_url", "")
            ])
    print(f"✅ Saved cleaned CSV to {csv_path}")

if __name__ == "__main__":
    import sys
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(base_dir, "sih2026_problem_statements.json")
    csv_file = os.path.join(base_dir, "sih2026_problem_statements.csv")
    
    if len(sys.argv) > 1 and sys.argv[1] == '--clean-only':
        clean_existing_dataset(json_file, csv_file)
    else:
        scrape_sih_problem_statements(output_json=json_file, output_csv=csv_file)
