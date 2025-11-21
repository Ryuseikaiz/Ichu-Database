
import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
import concurrent.futures

# Base URL
BASE_URL = "https://ichu.fandom.com"
URL_FIXES = {
    "/wiki/(Chinese_Zodiac_Scout)_Li_Chaoyang_LE/G": "/wiki/(Chinese_Zodiac_Scout)_Li_Chaoyang_LE/GR",
    "/wiki/(Kirameki_%E2%98%86_Sweet_Surprise)_Orihiro_Ryugu_N/HN": "/wiki/(Kirameki_☆_Sweet_Surprise)_Tatsuomi_Ryugu_N/HN",
    "/wiki/(Kirameki_☆_Sweet_Surprise)_Orihiro_Ryugu_N/HN": "/wiki/(Kirameki_☆_Sweet_Surprise)_Tatsuomi_Ryugu_N/HN",
    "/wiki/(fleur)_Kokoro_Hanabusa_LE/GR": "/wiki/(fleur)_Kokoro_Hanabusa_GR",
    "/wiki/(3rd_Anniversary_Scout)_Akio_Kusakabe_LE/GR": "/wiki/(3rd_Anniversary_Scout)_Akio_Tobikura_LE/GR",
    "/wiki/(2018_I-Chu_Awards_Blanc)_Seya_Aido_GR": "/wiki/(2018_I-Chu_Awards_Blanc)_Seiya_Aido_GR",
    "/wiki/(Best_Album_Ai_Version)_Chu_Version)_Kuro_Yakaku_GR": "/wiki/(Best_Album_Chu_Version)_Kuro_Yakaku_GR"
}

def get_soup(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return BeautifulSoup(response.content, 'html.parser')
        else:
            print(f"Failed to fetch {url}: Status {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_card_links():
    url = f"{BASE_URL}/wiki/Category:Cards"
    print(f"Fetching card list from: {url}")
    soup = get_soup(url)
    if not soup: return []

    range_pages = []
    members = soup.select('.category-page__member-link')
    for member in members:
        href = member.get('href')
        if href and "Category:" not in href:
            range_pages.append(BASE_URL + href)
            
    print(f"Found {len(range_pages)} range pages. Scanning for LE/GR cards...")
    card_links = []
    for range_url in range_pages:
        # print(f"Scanning range: {range_url}")
        range_soup = get_soup(range_url)
        if not range_soup: continue
        links = range_soup.select('table.article-table td a')
        for link in links:
            href = link.get('href')
            title = link.get('title', '')
            if href and "/wiki/File:" not in href and "action=edit" not in href:
                # Fix broken links
                if href in URL_FIXES:
                    print(f"Fixing URL: {href} -> {URL_FIXES[href]}")
                    href = URL_FIXES[href]
                
                # Skip image links that might have been picked up
                if href.startswith('http'):
                    continue

                if "LE" in title or "GR" in title:
                    full_url = BASE_URL + href
                    if full_url not in card_links:
                        card_links.append(full_url)
    return card_links

def extract_image_url(img_tag):
    if not img_tag: return None
    src = img_tag.get('data-src') or img_tag.get('src')
    if src:
        return src.split('/revision')[0]
    return None

def parse_card(url):
    soup = get_soup(url)
    if not soup: return None

    data = {"url": url}

    # 1. Name
    header = soup.select_one('.page-header__title') or soup.select_one('#firstHeading')
    data['name'] = header.text.strip() if header else "Unknown"
    print(f"Parsing: {data['name']}")

    # 2. Images (Unidolized / Idolized)
    data['images'] = {}
    
    def extract_from_container(container, title):
        img_link = container.select_one('a.image')
        img_tag = container.select_one('img')
        src = None
        
        # Prefer img tag src as it is the direct image
        if img_tag: 
            src = extract_image_url(img_tag)
        
        # Fallback to link href if no img src
        if not src and img_link: 
            src = img_link.get('href')
        
        if src and "/wiki/File:" not in src:
            # Clean URL
            src = src.split('/revision')[0]
            if "Unidolized" in title or "Un-idolized" in title:
                data['images']['unidolized'] = src
            elif "Idolized" in title:
                data['images']['idolized'] = src
            elif "In-Game" in title: # Sometimes used
                 if 'unidolized' not in data['images']:
                     data['images']['unidolized'] = src # Assumption

    # Try finding tabbers
    tabbers = soup.select('.tabber')
    for t in tabbers:
        # Old style
        tabs = t.select('.tabbertab')
        if tabs:
            for tab in tabs:
                extract_from_container(tab, tab.get('title', '').strip())
        
        # New style (wds-tabber)
        headers = t.select('.wds-tabs__tab')
        contents = t.select('.wds-tab__content')
        if len(headers) == len(contents):
            for h, c in zip(headers, contents):
                title = h.get('data-hash', '').strip() or h.text.strip()
                extract_from_container(c, title)

    # Fallback
    if not data['images']:
        main_img = soup.select_one('.pi-image-thumbnail') or soup.select_one('.infobox img')
        if main_img: data['images']['main'] = extract_image_url(main_img)

    # 3. Skills & Leader Skills
    data['skill'] = {"name": None, "description": None, "icon": None}
    data['leader_skill'] = {"name": None, "description": None, "icon": None}

    article_tables = soup.select('table.article')
    skill_tables = []
    for t in article_tables:
        if not t.select('tr.article-table'): continue
        # Removed the check for Wild/Pop/Cool icons because some skill descriptions contain them
        # and it was causing valid skill tables to be skipped (e.g. Satsuki Kururugi 2nd Anniv)
        skill_tables.append(t)
    
    extracted_skills = []
    
    for t in skill_tables:
        rows = t.find_all('tr')
        current_skill = None
        
        for row in rows:
            # Check if header row
            if 'article-table' in row.get('class', []):
                # Save previous skill if exists
                if current_skill:
                    extracted_skills.append(current_skill)
                
                # Start new skill
                current_skill = {
                    "name": row.text.strip(),
                    "description": "",
                    "icon": None
                }
            else:
                # Content row
                if current_skill:
                    text = row.text.strip()
                    if text:
                        if current_skill["description"]:
                            current_skill["description"] += "\n" + text
                        else:
                            current_skill["description"] = text
                    
                    # Look for icon
                    img = row.select_one('img')
                    if img and not current_skill["icon"]:
                        current_skill["icon"] = extract_image_url(img)
        
        # Append the last one
        if current_skill:
            extracted_skills.append(current_skill)

    # Assign to data
    for s in extracted_skills:
        desc = s['description']
        # Check for Leader Skill keywords
        is_leader = False
        if desc and ("Leader" in desc or "Activates when" in desc):
            is_leader = True
            
        if is_leader:
            data['leader_skill'] = s
        else:
            data['skill'] = s

    # 4. Stats
    stats = {
        "unidolized": {"initial": {}, "max_lv": {}},
        "idolized": {"initial": {}, "max_lv": {}, "etoile": {}}
    }
    stat_icons = {"wild": None, "pop": None, "cool": None}

    target_table = None
    # Find the table that contains stats. Usually has "Initial" and Wild/Pop/Cool icons.
    for table in soup.select("table"):
        if "Initial" in table.text and table.select('img[data-image-key*="Wild"]'):
            target_table = table
            break
    
    # Fallback: Look for table with "Max Lv." if "Initial" is missing or weird
    if not target_table:
        for table in soup.select("table"):
            if "Max Lv." in table.text and table.select('img[data-image-key*="Wild"]'):
                target_table = table
                break

    if target_table:
        # Extract icons
        imgs = target_table.find_all('img')
        for img in imgs:
            src = extract_image_url(img)
            key = img.get('data-image-key', '').lower()
            if 'wild' in key: stat_icons['wild'] = src
            elif 'pop' in key: stat_icons['pop'] = src
            elif 'cool' in key: stat_icons['cool'] = src

        rows = target_table.find_all('tr')
        current_section = "unidolized"
        current_label = None
        
        for row in rows:
            text = row.text.strip()
            
            # Determine Section (Unidolized vs Idolized)
            # Note: Some rows might be headers for the section
            if "Un-idolized" in text or "Unidolized" in text:
                current_section = "unidolized"
            if "Idolized" in text and "Un-idolized" not in text:
                current_section = "idolized"
            
            # Determine Label (Initial, Max Lv, Etoile)
            # We check this row's text. 
            # Sometimes the label is in a th, sometimes td.
            if "Initial" in text: current_label = "initial"
            elif "Max Lv" in text: current_label = "max_lv"
            elif "Etoile" in text: current_label = "etoile"
            
            # Extract numbers
            # We look for cells that contain numbers.
            # The structure is usually: [Label] [Wild] [Pop] [Cool]
            # Or [Section] [Label] [Wild] [Pop] [Cool]
            
            cells = row.find_all(['td', 'th'])
            values = []
            
            for cell in cells:
                # Skip cells that are just labels if possible, but regex handles it.
                # We want to find the 3 stat numbers.
                cell_text = cell.text.strip()
                # Regex to find numbers like "3,201" or "12345"
                # We ignore small numbers that might be level indicators if they are not stats?
                # Stats are usually > 1000, but N cards might be lower.
                # Let's just grab all number-like strings.
                
                # This regex matches "1,234" or "1234"
                matches = re.findall(r'(\d{1,3}(?:,\d{3})*|\d+)', cell_text)
                for m in matches:
                    # Filter out likely non-stat numbers if needed, but usually stats are the main numbers
                    # We might pick up "+5" from "Etoile +5". We should be careful.
                    val_str = m.replace(',', '')
                    if val_str.isdigit():
                        # Heuristic: Stats are usually 3 or 4 or 5 digits. 
                        # "5" from Etoile +5 is 1 digit.
                        if len(val_str) >= 3: 
                            values.append(m)
            
            # If we found at least 3 large numbers, assume they are Wild, Pop, Cool
            if len(values) >= 3 and current_label:
                # Take the last 3 found numbers (in case there were others)
                # The order is always Wild, Pop, Cool in the wiki tables
                final_values = values[-3:]
                stat_obj = {"wild": final_values[0], "pop": final_values[1], "cool": final_values[2]}
                
                if current_section == "idolized" and current_label == "etoile":
                    stats['idolized']['etoile'] = stat_obj
                elif current_section in stats and current_label in stats[current_section]:
                    stats[current_section][current_label] = stat_obj
                
                # Reset label after finding stats for it, to avoid applying to next row erroneously
                current_label = None

    data['stats'] = stats
    data['stat_icons'] = stat_icons

    return data

def main():
    links = get_card_links()
    print(f"Found {len(links)} LE/GR cards total.")
    
    results = []
    
    # Use ThreadPoolExecutor for concurrent fetching
    # Be polite to the server, don't use too many workers
    max_workers = 10 
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_url = {executor.submit(parse_card, link): link for link in links}
        
        completed_count = 0
        total_count = len(links)
        
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                data = future.result()
                if data:
                    results.append(data)
            except Exception as e:
                print(f"Error parsing {url}: {e}")
            
            completed_count += 1
            if completed_count % 10 == 0:
                print(f"Progress: {completed_count}/{total_count} cards processed.")

    # Sort results by name to keep JSON stable
    results.sort(key=lambda x: x.get('name', ''))
        
    with open('src/data/ichu_cards.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=4)
        
    print(f"Done. Saved {len(results)} cards to src/data/ichu_cards.json")

if __name__ == "__main__":
    main()
