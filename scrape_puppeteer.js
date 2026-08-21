/**
 * SIH 2026 Problem Statement Scraper (Puppeteer Headless Browser)
 * ===============================================================
 * Launches headless Chromium, navigates to the SIH 2026 PS page,
 * extracts all table records and modal popups, and saves to JSON.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeWithPuppeteer(url = 'https://sih.gov.in/sih2026PS', outputFile = 'sih2026_problem_statements.json') {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('Extracting data from DOM...');
  const result = await page.evaluate((sourceUrl) => {
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

    const rows = Array.from(document.querySelectorAll('#dataTablePS tbody > tr'));
    const items = [];

    rows.forEach((r, idx) => {
      const tds = r.querySelectorAll(':scope > td');
      if (tds.length < 8) return;

      const sNoRaw = tds[0].innerText.trim();
      const serialNo = /^\d+$/.test(sNoRaw) ? parseInt(sNoRaw, 10) : sNoRaw;
      const orgOuter = fixMojibake(tds[1].innerText.trim());

      const titleA = tds[2].querySelector('a');
      const titleOuter = fixMojibake(titleA ? titleA.innerText.trim() : '');

      const categoryOuter = tds[3].innerText.trim();
      const psIdOuter = tds[4].innerText.trim();
      const numIdMatch = psIdOuter.match(/\d+/);
      const numericId = numIdMatch ? parseInt(numIdMatch[0], 10) : null;

      const subCountRaw = tds[5].innerText.trim();
      const subParts = subCountRaw.split('/');
      const subCount = subParts.length > 0 && /^\d+$/.test(subParts[0]) ? parseInt(subParts[0], 10) : 0;
      const subCap = subParts.length > 1 && /^\d+$/.test(subParts[1]) ? parseInt(subParts[1], 10) : 500;

      const themeOuter = fixMojibake(tds[6].innerText.trim());
      const deadlineOuter = tds[7].innerText.trim();

      const modal = r.querySelector('.modal');
      const modalId = modal ? modal.id : `ViewProblemStatement${numericId || idx + 1}`;
      const modalData = {};

      if (modal) {
        modal.querySelectorAll('table tr').forEach(mtr => {
          const mtds = mtr.querySelectorAll('th, td');
          if (mtds.length >= 2) {
            const k = mtds[0].innerText.trim();
            const valDiv = mtds[1].querySelector('div') || mtds[1];
            const rawHtml = valDiv.innerHTML.trim();
            const valText = fixMojibake(valDiv.innerText.trim());

            const links = [];
            mtds[1].querySelectorAll('a').forEach(a => {
              const href = (a.getAttribute('href') || '').trim();
              if (href && href !== '#') links.push(href);
            });

            modalData[k] = { text: valText, rawHtml, links };
          }
        });
      }

      const desc = modalData['Description']?.text || '';
      const descHtml = modalData['Description']?.rawHtml || '';
      const dept = modalData['Department']?.text || orgOuter;
      const ytRaw = modalData['Youtube Link']?.text;
      const yt = ytRaw && !['', 'none', 'na', 'n/a'].includes(ytRaw.toLowerCase()) ? ytRaw : null;
      const dataLinkRaw = modalData['Dataset Link']?.text;
      const datasetInfo = dataLinkRaw && !['', 'none', 'na', 'n/a'].includes(dataLinkRaw.toLowerCase()) ? dataLinkRaw : null;
      const contactRaw = modalData['Contact info']?.text;
      const contactInfo = contactRaw && !['', 'none', 'na', 'n/a'].includes(contactRaw.toLowerCase()) ? contactRaw : null;

      items.push({
        id: psIdOuter,
        numeric_id: numericId,
        serial_no: serialNo,
        title: titleOuter,
        organization: orgOuter,
        department: dept,
        category: categoryOuter,
        theme: themeOuter,
        submitted_ideas: { count: subCount, capacity: subCap, raw: subCountRaw },
        deadline: deadlineOuter,
        youtube_link: yt,
        dataset_info: datasetInfo,
        contact_info: contactInfo,
        description: desc,
        description_html: descHtml,
        modal_id: modalId,
        web_url: `${sourceUrl}#${modalId}`
      });
    });

    return items;
  }, url);

  await browser.close();

  const dataset = {
    metadata: {
      source_url: url,
      scraped_at: new Date().toISOString(),
      scraper_engine: 'puppeteer',
      total_problem_statements: result.length
    },
    problem_statements: result
  };

  fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`-> Saved ${result.length} problem statements via Puppeteer to ${outputFile}`);
}

if (require.main === module) {
  scrapeWithPuppeteer().catch(console.error);
}

module.exports = { scrapeWithPuppeteer };
