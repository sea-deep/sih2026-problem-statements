/**
 * SIH 2026 Problem Statement Scraper (Node.js)
 * ============================================
 * Fetches and parses all 226 problem statements and modal details from
 * https://sih.gov.in/sih2026PS into structured JSON.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

function fixMojibake(text) {
  if (!text) return '';
  const replacements = {
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
    '\xa0': ' '
  };
  let res = text;
  for (const [k, v] of Object.entries(replacements)) {
    res = res.split(k).join(v);
  }
  return res;
}

function extractUrls(text) {
  if (!text) return [];
  const urlPattern = /https?:\/\/[^\s()<>]+[^\s`!()\[\]{};:'".,<>?«»“”‘’]/g;
  const matches = text.match(urlPattern) || [];
  return Array.from(new Set(matches)).sort();
}

function cleanHtmlToMarkdown(htmlSnippet, $) {
  if (!htmlSnippet) return '';

  let htmlStr = htmlSnippet;
  if (typeof htmlSnippet !== 'string') {
    htmlStr = $(htmlSnippet).html() || '';
  }

  // Unescape if double encoded
  if (htmlStr.includes('&lt;') && htmlStr.includes('&gt;')) {
    const $temp = cheerio.load(`<textarea id="t">${htmlStr}</textarea>`);
    htmlStr = $temp('#t').text();
  }

  // Replace <br> and <p> with newlines
  htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n');
  htmlStr = htmlStr.replace(/<\/p>/gi, '\n\n');
  htmlStr = htmlStr.replace(/<p[^>]*>/gi, '');

  const $sub = cheerio.load(`<div>${htmlStr}</div>`, null, false);

  // Format bold & headings
  $sub('b, strong, h1, h2, h3, h4, h5, h6, u').each((_, el) => {
    const txt = $sub(el).text().trim();
    if (txt) {
      $sub(el).replaceWith(` **${txt}** `);
    }
  });

  // Format links
  $sub('a').each((_, el) => {
    const href = ($sub(el).attr('href') || '').trim();
    const txt = $sub(el).text().trim();
    if (href && href !== '#') {
      if (txt && txt !== href) {
        $sub(el).replaceWith(` [${txt}](${href}) `);
      } else {
        $sub(el).replaceWith(` ${href} `);
      }
    }
  });

  let text = $sub.text();
  text = fixMojibake(text);

  // Normalize bullet points
  const lines = text.split(/\r?\n/).map(line => {
    line = line.trim();
    if (/^(?:&#8226;|•|·|â€¢|\*(?!\*))\s*/.test(line)) {
      line = '- ' + line.replace(/^(?:&#8226;|•|·|â€¢|\*(?!\*))\s*/, '').trim();
    }
    return line;
  });

  let result = lines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

function parseSections(markdownText) {
  const sections = {};
  if (!markdownText) return sections;

  const headerPattern = /(?:\n|^)\s*\*\*([A-Za-z0-9\s/&,._\-()]+?):\*\*\s*/g;
  let match;
  const indices = [];

  while ((match = headerPattern.exec(markdownText)) !== null) {
    indices.push({
      title: match[1].trim(),
      index: match.index,
      matchLength: match[0].length
    });
  }

  if (indices.length > 0) {
    const preamble = markdownText.slice(0, indices[0].index).trim();
    if (preamble) sections.preamble = preamble;

    for (let i = 0; i < indices.length; i++) {
      const current = indices[i];
      const start = current.index + current.matchLength;
      const end = (i + 1 < indices.length) ? indices[i + 1].index : markdownText.length;
      const content = markdownText.slice(start, end).trim();
      const secKey = current.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

      sections[secKey] = {
        title: current.title,
        content
      };
    }
  }

  return sections;
}

async function scrapeSIH(url = 'https://sih.gov.in/sih2026PS', outputFile = 'sih2026_problem_statements.json') {
  console.log(`Fetching from ${url}...`);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = response.data;
  console.log(`HTML loaded (${html.length} chars). Parsing table...`);
  const $ = cheerio.load(html);

  const mainTable = $('#dataTablePS');
  if (!mainTable.length) {
    throw new Error('Table #dataTablePS not found in page');
  }

  const rows = mainTable.find('tbody > tr');
  console.log(`Found ${rows.length} table rows.`);

  const problemStatements = [];

  rows.each((idx, r) => {
    const $row = $(r);
    const tds = $row.children('td');
    if (tds.length < 8) return;

    const sNoRaw = $(tds[0]).text().trim();
    const serialNo = /^\d+$/.test(sNoRaw) ? parseInt(sNoRaw, 10) : sNoRaw;

    const orgOuter = fixMojibake($(tds[1]).text().trim());
    const titleA = $(tds[2]).find('a');
    const titleOuter = fixMojibake(titleA.text().trim());

    const categoryOuter = $(tds[3]).text().trim();
    const psIdOuter = $(tds[4]).text().trim();
    const numIdMatch = psIdOuter.match(/\d+/);
    const numericId = numIdMatch ? parseInt(numIdMatch[0], 10) : null;

    const subCountRaw = $(tds[5]).text().trim();
    const subParts = subCountRaw.split('/');
    const subCount = subParts.length > 0 && /^\d+$/.test(subParts[0]) ? parseInt(subParts[0], 10) : 0;
    const subCap = subParts.length > 1 && /^\d+$/.test(subParts[1]) ? parseInt(subParts[1], 10) : 500;

    const themeOuter = fixMojibake($(tds[6]).text().trim());
    const deadlineOuter = $(tds[7]).text().trim();

    // Modal parsing
    const modal = $row.find('.modal');
    const modalId = modal.attr('id') || `ViewProblemStatement${numericId || idx + 1}`;
    const modalData = {};

    if (modal.length) {
      modal.find('table tr').each((_, mtr) => {
        const mtds = $(mtr).children('th, td');
        if (mtds.length >= 2) {
          const k = $(mtds[0]).text().trim();
          const valCell = $(mtds[1]);
          const valDiv = valCell.find('div').length ? valCell.find('div') : valCell;

          const rawHtmlContent = valDiv.html() || '';
          const valText = fixMojibake(valDiv.text().trim());

          const links = [];
          valCell.find('a').each((_, a) => {
            const href = ($(a).attr('href') || '').trim();
            if (href && href !== '#') {
              links.push(href);
            }
          });

          modalData[k] = {
            text: valText,
            rawHtml: rawHtmlContent,
            links,
            element: valDiv
          };
        }
      });
    }

    const descElem = modalData['Description']?.element;
    const descRawHtml = modalData['Description']?.rawHtml || '';
    const descMd = descElem ? cleanHtmlToMarkdown(descElem, $) : '';

    const department = modalData['Department']?.text || orgOuter;
    const ytRaw = modalData['Youtube Link']?.text;
    const youtubeLink = ytRaw && !['', 'none', 'na', 'n/a'].includes(ytRaw.toLowerCase()) ? ytRaw : null;

    const datasetElem = modalData['Dataset Link']?.element;
    let datasetInfo = datasetElem ? cleanHtmlToMarkdown(datasetElem, $) : (modalData['Dataset Link']?.text || null);
    if (!datasetInfo || ['', 'none', 'na', 'n/a'].includes(datasetInfo.toLowerCase())) {
      datasetInfo = null;
    }

    const contactElem = modalData['Contact info']?.element;
    let contactInfo = contactElem ? cleanHtmlToMarkdown(contactElem, $) : (modalData['Contact info']?.text || null);
    if (!contactInfo || ['', 'none', 'na', 'n/a'].includes(contactInfo.toLowerCase())) {
      contactInfo = null;
    }

    const allUrls = new Set();
    extractUrls(descMd).forEach(u => allUrls.add(u));
    if (datasetInfo) extractUrls(datasetInfo).forEach(u => allUrls.add(u));
    Object.values(modalData).forEach(v => (v.links || []).forEach(u => allUrls.add(u)));

    const sections = parseSections(descMd);

    problemStatements.push({
      id: psIdOuter,
      numeric_id: numericId,
      serial_no: serialNo,
      title: titleOuter,
      organization: orgOuter,
      department,
      category: categoryOuter,
      theme: themeOuter,
      submitted_ideas: {
        count: subCount,
        capacity: subCap,
        raw: subCountRaw
      },
      deadline: deadlineOuter,
      youtube_link: youtubeLink,
      dataset_info: datasetInfo,
      contact_info: contactInfo,
      external_links: Array.from(allUrls).sort(),
      sections,
      description: descMd,
      description_html: descRawHtml,
      modal_id: modalId,
      web_url: `${url}#${modalId}`
    });
  });

  const categoryCounts = {};
  const themeCounts = {};
  const orgCounts = {};

  problemStatements.forEach(ps => {
    categoryCounts[ps.category] = (categoryCounts[ps.category] || 0) + 1;
    themeCounts[ps.theme] = (themeCounts[ps.theme] || 0) + 1;
    orgCounts[ps.organization] = (orgCounts[ps.organization] || 0) + 1;
  });

  const dataset = {
    metadata: {
      source_url: url,
      scraped_at: new Date().toISOString(),
      total_problem_statements: problemStatements.length,
      statistics: {
        categories: categoryCounts,
        themes: Object.fromEntries(Object.entries(themeCounts).sort((a, b) => b[1] - a[1])),
        organizations: Object.fromEntries(Object.entries(orgCounts).sort((a, b) => b[1] - a[1]))
      }
    },
    problem_statements: problemStatements
  };

  fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`-> Saved ${problemStatements.length} problem statements to ${outputFile}`);
  return dataset;
}

if (require.main === module) {
  scrapeSIH().catch(console.error);
}

module.exports = { scrapeSIH };
