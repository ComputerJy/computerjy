<?php
/**
 * Markdown for Agents - RFC Content Negotiation Handler
 * Converts ComputerJy World pages to clean, agent-ready Markdown when Accept: text/markdown is requested.
 */

// Set proper headers
header('Content-Type: text/markdown; charset=utf-8');
header('Vary: Accept');
header('Access-Control-Allow-Origin: *');

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = rtrim($uri, '/') ?: '/';

$dist_dir = '/var/www/computerjy_dist';

// 0. Static markdown documents
if ($uri === '/auth.md' || $uri === '/.well-known/auth.md') {
    $auth_file = $dist_dir . '/auth.md';
    if (file_exists($auth_file)) {
        echo file_get_contents($auth_file);
        exit;
    }
}

function html_to_markdown($html) {
    if (empty($html)) return '';
    
    // Replace headings
    $md = preg_replace('/<h1[^>]*>(.*?)<\/h1>/si', "\n# $1\n\n", $html);
    $md = preg_replace('/<h2[^>]*>(.*?)<\/h2>/si', "\n## $1\n\n", $md);
    $md = preg_replace('/<h3[^>]*>(.*?)<\/h3>/si', "\n### $1\n\n", $md);
    $md = preg_replace('/<h4[^>]*>(.*?)<\/h4>/si', "\n#### $1\n\n", $md);
    
    // Replace links
    $md = preg_replace('/<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/si', '[$2]($1)', $md);
    
    // Replace code blocks and pre
    $md = preg_replace('/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/si', "\n```\n$1\n```\n\n", $md);
    $md = preg_replace('/<code[^>]*>(.*?)<\/code>/si', '`$1`', $md);
    
    // Replace blockquotes
    $md = preg_replace('/<blockquote[^>]*>(.*?)<\/blockquote>/si', "\n> $1\n\n", $md);
    
    // Replace list items and paragraphs
    $md = preg_replace('/<li[^>]*>(.*?)<\/li>/si', "- $1\n", $md);
    $md = preg_replace('/<p[^>]*>(.*?)<\/p>/si', "$1\n\n", $md);
    $md = preg_replace('/<br\s*\/?>/si', "\n", $md);
    $md = preg_replace('/<hr\s*\/?>/si', "\n---\n\n", $md);
    
    // Strip remaining tags
    $md = strip_tags($md);
    
    // Unescape entities
    $md = html_entity_decode($md, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    
    // Normalize newlines
    $md = preg_replace("/\n{3,}/", "\n\n", $md);
    return trim($md);
}

// 1. Single Post View: /posts/{slug}
if (preg_match('#^/posts/([^/]+)#', $uri, $matches)) {
    $slug = urldecode($matches[1]);
    $posts_file = $dist_dir . '/data/posts.json';
    
    $post_data = null;
    if (file_exists($posts_file)) {
        $posts = json_decode(file_get_contents($posts_file), true);
        if (is_array($posts)) {
            foreach ($posts as $p) {
                if ($p['slug'] === $slug) {
                    $post_data = $p;
                    break;
                }
            }
        }
    }
    
    if ($post_data) {
        $title = $post_data['title']['rendered'] ?? 'Article';
        $date = date('F j, Y', strtotime($post_data['date'] ?? 'now'));
        $cat = $post_data['primaryCategory']['name'] ?? 'Tech';
        $content = html_to_markdown($post_data['content']['rendered'] ?? '');
        
        $output = "# {$title}\n\n";
        $output .= "*Published: {$date} | Category: {$cat} | Author: Eyad Salah*\n";
        $output .= "*URL: https://www.computerjy.com{$uri}*\n\n";
        $output .= "---\n\n";
        $output .= $content . "\n\n";
        $output .= "---\n";
        $output .= "*ComputerJy World — https://www.computerjy.com/*\n";
        
        $tokens = (int) (str_word_count($output) * 1.33);
        header("x-markdown-tokens: {$tokens}");
        echo $output;
        exit;
    }
}

// 2. Homepage or general listing: /
$posts_file = $dist_dir . '/data/posts.json';
$output = "# ComputerJy World\n\n";
$output .= "> Entertainment, Tech tips & Occasional software reviews by Eyad Salah since 2007.\n\n";
$output .= "Website: https://www.computerjy.com/\n";
$output .= "API Catalog: https://www.computerjy.com/.well-known/api-catalog\n";
$output .= "OpenAPI Spec: https://www.computerjy.com/api/openapi.json\n";
$output .= "Auth.md: https://www.computerjy.com/auth.md\n\n";
$output .= "## Articles & Archives\n\n";

if (file_exists($posts_file)) {
    $posts = json_decode(file_get_contents($posts_file), true);
    if (is_array($posts)) {
        $count = 0;
        foreach ($posts as $p) {
            if ($count++ >= 30) break;
            $title = $p['title']['rendered'] ?? 'Untitled';
            $slug = $p['slug'] ?? '';
            $date = date('Y-m-d', strtotime($p['date'] ?? 'now'));
            $cat = $p['primaryCategory']['name'] ?? 'Tech';
            $excerpt = trim(strip_tags($p['excerpt']['rendered'] ?? ''));
            $output .= "- **[{$title}](https://www.computerjy.com/posts/{$slug}/)** ({$date} in *{$cat}*)\n";
            if (!empty($excerpt)) {
                $output .= "  > {$excerpt}\n\n";
            }
        }
    }
}

$output .= "\n---\n";
$output .= "*For full search index of all 413+ articles, see: https://www.computerjy.com/search-index.json*\n";

$tokens = (int) (str_word_count($output) * 1.33);
header("x-markdown-tokens: {$tokens}");
echo $output;
exit;
