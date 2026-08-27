#!/usr/bin/env python3
"""
WordPress XML Export Parser for ComputerJy World
Extracts posts, pages, categories, tags, comments, and media attachments into structured JSON.
"""

import sys
import os
import json
import re
import urllib.parse
import xml.etree.ElementTree as ET

NS = {
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wfw': 'http://wellformedweb.org/CommentAPI/',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'wp': 'http://wordpress.org/export/1.2/'
}

def clean_html(text):
    if not text:
        return ''
    return text.strip()

def sanitize_slug(raw_slug):
    if not raw_slug:
        return ''
    # Unquote URL-encoded unicode slugs
    unquoted = urllib.parse.unquote(raw_slug).strip()
    # Strip dangerous characters for filesystem/URL routing
    cleaned = re.sub(r'[\?\#\<\>\"\'\*\:]', '', unquoted)
    return cleaned

def calculate_reading_time(html_content):
    if not html_content:
        return '1 min read'
    # Strip HTML tags
    text = re.sub(r'<[^>]*>', ' ', html_content)
    words = len(text.strip().split())
    minutes = max(1, (words + 199) // 200)
    return f"{minutes} min read"

def parse_wp_xml(xml_path, out_dir):
    print(f"Reading & sanitizing WordPress export file: {xml_path}")
    with open(xml_path, 'rb') as f:
        raw_bytes = f.read()

    # Strip null bytes and illegal control characters from XML
    clean_bytes = re.sub(b'[\x00-\x08\x0b\x0c\x0e-\x1f]', b'', raw_bytes)
    
    root = ET.fromstring(clean_bytes)
    channel = root.find('channel')
    if channel is None:
        print("Invalid XML: No channel element found")
        sys.exit(1)

    # 1. Parse Categories defined in channel
    categories_dict = {}
    for cat_elem in channel.findall('wp:category', NS):
        slug = cat_elem.find('wp:category_nicename', NS)
        name = cat_elem.find('wp:cat_name', NS)
        desc = cat_elem.find('wp:category_description', NS)
        cat_id = cat_elem.find('wp:term_id', NS)
        
        raw_slug_val = slug.text if slug is not None and slug.text else ''
        slug_val = sanitize_slug(raw_slug_val)
        name_val = name.text if name is not None and name.text else slug_val
        desc_val = desc.text if desc is not None and desc.text else ''
        id_val = int(cat_id.text) if cat_id is not None and cat_id.text and cat_id.text.isdigit() else 0
        
        if slug_val:
            categories_dict[slug_val] = {
                'id': id_val,
                'name': name_val,
                'slug': slug_val,
                'description': desc_val,
                'count': 0
            }

    # 2. Parse Tags defined in channel
    tags_dict = {}
    for tag_elem in channel.findall('wp:tag', NS):
        slug = tag_elem.find('wp:tag_slug', NS)
        name = tag_elem.find('wp:tag_name', NS)
        tag_id = tag_elem.find('wp:term_id', NS)
        
        raw_slug_val = slug.text if slug is not None and slug.text else ''
        slug_val = sanitize_slug(raw_slug_val)
        name_val = name.text if name is not None and name.text else slug_val
        id_val = int(tag_id.text) if tag_id is not None and tag_id.text and tag_id.text.isdigit() else 0

        if slug_val:
            tags_dict[slug_val] = {
                'id': id_val,
                'name': name_val,
                'slug': slug_val,
                'count': 0
            }

    # 3. Pass 1: Collect Attachments (Images)
    attachments_map = {}
    items = channel.findall('item')
    print(f"Total XML items found: {len(items)}")

    for item in items:
        post_type_elem = item.find('wp:post_type', NS)
        post_type = post_type_elem.text if post_type_elem is not None else ''
        
        if post_type == 'attachment':
            post_id_elem = item.find('wp:post_id', NS)
            att_url_elem = item.find('wp:attachment_url', NS)
            
            if post_id_elem is not None and att_url_elem is not None:
                pid = post_id_elem.text
                url = att_url_elem.text
                if pid and url:
                    attachments_map[pid] = url

    print(f"Found {len(attachments_map)} media attachments.")

    # 4. Pass 2: Collect Posts and Pages
    posts_list = []
    pages_list = []
    all_comments = []

    for item in items:
        post_type_elem = item.find('wp:post_type', NS)
        status_elem = item.find('wp:status', NS)
        
        post_type = post_type_elem.text if post_type_elem is not None else ''
        status = status_elem.text if status_elem is not None else ''

        # Only process published items
        if status != 'publish':
            continue

        title_elem = item.find('title')
        post_date_elem = item.find('wp:post_date', NS)
        post_name_elem = item.find('wp:post_name', NS)
        post_id_elem = item.find('wp:post_id', NS)
        content_elem = item.find('content:encoded', NS)
        excerpt_elem = item.find('excerpt:encoded', NS)
        
        post_id = int(post_id_elem.text) if post_id_elem is not None and post_id_elem.text and post_id_elem.text.isdigit() else 0
        title = clean_html(title_elem.text if title_elem is not None else 'Untitled')
        raw_slug = post_name_elem.text if post_name_elem is not None and post_name_elem.text else f"post-{post_id}"
        slug = sanitize_slug(raw_slug) or f"post-{post_id}"
        content = content_elem.text if content_elem is not None and content_elem.text else ''
        excerpt = excerpt_elem.text if excerpt_elem is not None and excerpt_elem.text else ''
        post_date = post_date_elem.text if post_date_elem is not None and post_date_elem.text else ''
        
        if not excerpt and content:
            plain = re.sub(r'<[^>]*>', ' ', content).strip()
            excerpt = (plain[:180] + '...') if len(plain) > 180 else plain

        # Parse postmeta
        thumbnail_id = None
        yoast_desc = None
        for meta in item.findall('wp:postmeta', NS):
            key = meta.find('wp:meta_key', NS)
            val = meta.find('wp:meta_value', NS)
            if key is not None and val is not None:
                if key.text == '_thumbnail_id':
                    thumbnail_id = val.text
                elif key.text == '_yoast_wpseo_metadesc':
                    yoast_desc = val.text

        # Featured image resolution
        featured_image = None
        if thumbnail_id and thumbnail_id in attachments_map:
            featured_image = attachments_map[thumbnail_id]
        else:
            # Check for inline <img> inside content
            img_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', content)
            if img_match:
                featured_image = img_match.group(1)

        # Parse categories and tags for this item
        item_categories = []
        item_tags = []
        for cat in item.findall('category'):
            domain = cat.attrib.get('domain', '')
            cat_slug = sanitize_slug(cat.attrib.get('nicename', ''))
            cat_name = cat.text or cat_slug
            
            if domain == 'category' and cat_slug:
                if cat_slug not in categories_dict:
                    categories_dict[cat_slug] = {
                        'id': len(categories_dict) + 1,
                        'name': cat_name,
                        'slug': cat_slug,
                        'description': '',
                        'count': 0
                    }
                categories_dict[cat_slug]['count'] += 1
                item_categories.append({'name': cat_name, 'slug': cat_slug})
            elif domain == 'post_tag' and cat_slug:
                if cat_slug not in tags_dict:
                    tags_dict[cat_slug] = {
                        'id': len(tags_dict) + 1,
                        'name': cat_name,
                        'slug': cat_slug,
                        'count': 0
                    }
                tags_dict[cat_slug]['count'] += 1
                item_tags.append({'name': cat_name, 'slug': cat_slug})

        # Parse comments
        item_comments = []
        for comm in item.findall('wp:comment', NS):
            comm_id = comm.find('wp:comment_id', NS)
            comm_author = comm.find('wp:comment_author', NS)
            comm_email = comm.find('wp:comment_author_email', NS)
            comm_url = comm.find('wp:comment_author_url', NS)
            comm_date = comm.find('wp:comment_date', NS)
            comm_content = comm.find('wp:comment_content', NS)
            comm_approved = comm.find('wp:comment_approved', NS)
            comm_parent = comm.find('wp:comment_parent', NS)

            approved = comm_approved.text if comm_approved is not None else '1'
            if approved == '1':
                c_obj = {
                    'id': int(comm_id.text) if comm_id is not None and comm_id.text else 0,
                    'post_id': post_id,
                    'author': clean_html(comm_author.text if comm_author is not None else 'Reader'),
                    'email': comm_email.text if comm_email is not None else '',
                    'url': comm_url.text if comm_url is not None else '',
                    'date': comm_date.text if comm_date is not None else '',
                    'content': clean_html(comm_content.text if comm_content is not None else ''),
                    'parent': int(comm_parent.text) if comm_parent is not None and comm_parent.text and comm_parent.text.isdigit() else 0
                }
                item_comments.append(c_obj)
                all_comments.append(c_obj)

        reading_time = calculate_reading_time(content)
        primary_category = item_categories[0] if item_categories else {'name': 'Tech', 'slug': 'tech'}

        item_data = {
            'id': post_id,
            'slug': slug,
            'title': {'rendered': title},
            'excerpt': {'rendered': excerpt},
            'content': {'rendered': content},
            'date': post_date,
            'categories': [c['slug'] for c in item_categories],
            'tags': [t['slug'] for t in item_tags],
            'primaryCategory': primary_category,
            'featuredImageUrl': featured_image or 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
            'readingTime': reading_time,
            'commentsCount': len(item_comments),
            'comments': item_comments,
            'metaDescription': yoast_desc or excerpt
        }

        if post_type == 'post':
            posts_list.append(item_data)
        elif post_type == 'page':
            pages_list.append(item_data)

    # Sort posts by date descending
    posts_list.sort(key=lambda x: x.get('date', ''), reverse=True)

    # Filter categories and tags with count > 0
    active_categories = [c for c in categories_dict.values() if c['count'] > 0]
    active_categories.sort(key=lambda x: x['count'], reverse=True)

    active_tags = [t for t in tags_dict.values() if t['count'] > 0]
    active_tags.sort(key=lambda x: x['count'], reverse=True)

    print(f"\nSuccessfully parsed:")
    print(f"  - {len(posts_list)} Published Posts")
    print(f"  - {len(pages_list)} Published Pages")
    print(f"  - {len(all_comments)} Approved Comments")
    print(f"  - {len(active_categories)} Active Categories")
    print(f"  - {len(active_tags)} Active Tags")

    # Write JSON files
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, 'posts.json'), 'w', encoding='utf-8') as f:
        json.dump(posts_list, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_dir, 'pages.json'), 'w', encoding='utf-8') as f:
        json.dump(pages_list, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_dir, 'categories.json'), 'w', encoding='utf-8') as f:
        json.dump(active_categories, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_dir, 'tags.json'), 'w', encoding='utf-8') as f:
        json.dump(active_tags, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_dir, 'comments.json'), 'w', encoding='utf-8') as f:
        json.dump(all_comments, f, ensure_ascii=False, indent=2)

    print(f"\nAll JSON data saved to {out_dir}")

if __name__ == '__main__':
    xml_file = sys.argv[1] if len(sys.argv) > 1 else '/home/eyad/Downloads/computerjyworld.WordPress.2026-08-27.xml'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else '/home/eyad/code/computerjy/src/data'
    parse_wp_xml(xml_file, output_dir)
