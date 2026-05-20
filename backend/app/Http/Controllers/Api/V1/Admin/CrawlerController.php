<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrawledPost;
use App\Models\Post;
use DOMDocument;
use DOMXPath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CrawlerController extends Controller
{
    // ── List ──────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $items = CrawledPost::with('post:id,title,slug')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => $items]);
    }

    // ── Crawl + save to DB ────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $request->validate(['url' => ['required', 'url']]);

        $crawled = $this->doCrawl($request->input('url'));
        if (!$crawled['success']) {
            return response()->json(['success' => false, 'message' => $crawled['message']], 422);
        }

        $existing = CrawledPost::where('source_url', $crawled['data']['source_url'])->first();

        if ($existing) {
            $existing->touch();
            return response()->json(['success' => true, 'data' => $existing, 'updated' => true]);
        }

        $item = CrawledPost::create([
            'source_url'      => $crawled['data']['source_url'],
            'title'           => $crawled['data']['title'],
            'excerpt'         => $crawled['data']['excerpt'],
            'content'         => $crawled['data']['content'],
            'thumbnail'       => $crawled['data']['thumbnail'],
            'seo_title'       => $crawled['data']['seo_title'],
            'seo_description' => $crawled['data']['seo_description'],
        ]);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────
    public function show(CrawledPost $crawledPost): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $crawledPost->load('post:id,title,slug')]);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public function destroy(CrawledPost $crawledPost): JsonResponse
    {
        $crawledPost->delete();
        return response()->json(['success' => true]);
    }

    // ── Publish → create Post ─────────────────────────────────────────────────
    public function publish(Request $request, CrawledPost $crawledPost): JsonResponse
    {
        if ($crawledPost->status === 'published') {
            return response()->json(['success' => false, 'message' => 'Tin này đã được publish rồi'], 422);
        }

        $title = $crawledPost->title ?? 'Bài viết từ crawl';
        $slug  = Str::slug($title);
        $base  = $slug ?: 'bai-viet';
        $i     = 1;
        while (Post::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $post = Post::create([
            'title'           => $title,
            'slug'            => $slug,
            'excerpt'         => $crawledPost->excerpt,
            'content'         => $crawledPost->content ?? '',
            'thumbnail'       => $crawledPost->thumbnail,
            'status'          => $request->input('status', 'draft'),
            'is_featured'     => false,
            'user_id'         => $request->user()->id,
            'seo_title'       => $crawledPost->seo_title,
            'seo_description' => $crawledPost->seo_description,
        ]);

        $crawledPost->update(['status' => 'published', 'post_id' => $post->id]);

        return response()->json(['success' => true, 'data' => ['post_id' => $post->id]]);
    }

    // ── Pure fetch (for inline CrawlModal in post editor) ────────────────────
    public function fetch(Request $request): JsonResponse
    {
        $request->validate(['url' => ['required', 'url']]);
        $result = $this->doCrawl($request->input('url'));
        return response()->json($result, $result['success'] ? 200 : 422);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Core crawl logic
    // ═════════════════════════════════════════════════════════════════════════

    private function doCrawl(string $url): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'vi-VN,vi;q=0.9,en;q=0.8',
                ])
                ->get($url);

            if (!$response->successful()) {
                return ['success' => false, 'message' => 'Không thể truy cập URL này'];
            }

            $html = $response->body();
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Lỗi khi tải trang: ' . $e->getMessage()];
        }

        // ── Regex-based extraction (no DOMDocument encoding issues) ──────────
        // JSON-LD must be extracted from raw HTML before any encoding transform
        $jsonLd    = $this->extractJsonLdRaw($html);
        $ogTitle   = $this->regexMeta($html, 'og:title');
        $ogDesc    = $this->regexMeta($html, 'og:description');
        $ogImage   = $this->regexMeta($html, 'og:image')
                  ?? $this->regexMetaName($html, 'twitter:image');

        // ── Title ─────────────────────────────────────────────────────────────
        $title = $this->pickFirst(
            $jsonLd['headline'] ?? null,
            $jsonLd['name']     ?? null,
            $jsonLd['title']    ?? null,
            $ogTitle,
            $this->regexTag($html, 'title'),
        );

        // ── Excerpt ───────────────────────────────────────────────────────────
        $excerpt = $this->pickFirst($ogDesc, $this->regexMetaName($html, 'description'));
        if (!$excerpt && isset($jsonLd['description'])) {
            $excerpt = mb_substr(trim(strip_tags($jsonLd['description'])), 0, 300);
        }

        // ── Content ───────────────────────────────────────────────────────────
        $content = $this->extractContent($html, $jsonLd);

        // ── Thumbnail ─────────────────────────────────────────────────────────
        $thumbnail = $ogImage ? $this->resolveUrl($ogImage, $url) : '';

        return [
            'success' => true,
            'data'    => [
                'title'           => trim($title ?? ''),
                'excerpt'         => trim($excerpt ?? ''),
                'thumbnail'       => $thumbnail,
                'content'         => $content,
                'seo_title'       => trim($ogTitle ?? $title ?? ''),
                'seo_description' => trim($ogDesc ?? $excerpt ?? ''),
                'source_url'      => $url,
            ],
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Extraction helpers (regex-based — encoding-safe)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Extract JSON-LD structured data directly from raw HTML using regex.
     * MUST NOT go through DOMDocument — mb_convert_encoding corrupts 4-byte
     * Unicode (supplementary plane chars) making json_decode fail.
     */
    private function extractJsonLdRaw(string $html): array
    {
        preg_match_all(
            '/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/si',
            $html,
            $matches
        );

        if (empty($matches[1])) return [];

        $priority = ['Article', 'BlogPosting', 'NewsArticle', 'JobPosting', 'Product', 'WebPage'];
        $best     = [];

        foreach ($matches[1] as $json) {
            $data = json_decode(trim($json), true);
            if (!is_array($data)) continue;

            $type = $data['@type'] ?? '';
            if (in_array($type, $priority)) {
                if (empty($best) || array_search($type, $priority) < array_search($best['@type'] ?? '', $priority)) {
                    $best = $data;
                }
            } elseif (empty($best)) {
                $best = $data;
            }
        }

        return $best;
    }

    /** og:property meta tags */
    private function regexMeta(string $html, string $property): ?string
    {
        if (preg_match('/<meta[^>]+property=["\']' . preg_quote($property, '/') . '["\'][^>]+content=["\'](.*?)["\']/i', $html, $m)) {
            return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null;
        }
        if (preg_match('/<meta[^>]+content=["\'](.*?)["\'][^>]+property=["\']' . preg_quote($property, '/') . '["\'][^>]*/i', $html, $m)) {
            return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null;
        }
        return null;
    }

    /** name= meta tags */
    private function regexMetaName(string $html, string $name): ?string
    {
        if (preg_match('/<meta[^>]+name=["\']' . preg_quote($name, '/') . '["\'][^>]+content=["\'](.*?)["\']/i', $html, $m)) {
            return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null;
        }
        if (preg_match('/<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']' . preg_quote($name, '/') . '["\'][^>]*/i', $html, $m)) {
            return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null;
        }
        return null;
    }

    /** First non-empty value */
    private function pickFirst(?string ...$values): ?string
    {
        foreach ($values as $v) {
            if ($v !== null && trim($v) !== '') return trim($v);
        }
        return null;
    }

    /** Extract text from a simple HTML tag */
    private function regexTag(string $html, string $tag): ?string
    {
        if (preg_match('/<' . $tag . '[^>]*>(.*?)<\/' . $tag . '>/si', $html, $m)) {
            return html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null;
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Content extraction
    // ═════════════════════════════════════════════════════════════════════════

    private function extractContent(string $html, array $jsonLd): string
    {
        // ── 1. JSON-LD body fields ────────────────────────────────────────────
        foreach (['articleBody', 'description', 'text'] as $key) {
            if (!empty($jsonLd[$key]) && is_string($jsonLd[$key]) && mb_strlen($jsonLd[$key]) > 50) {
                return $this->cleanHtmlForEditor($this->structureToHtml($jsonLd[$key]));
            }
        }

        // ── 2. DOMDocument HTML selectors (fallback for traditional sites) ────
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        // Use XML declaration to tell libxml the encoding — avoids mb_convert_encoding
        $doc->loadHTML('<?xml version="1.0" encoding="UTF-8"?>' . $html);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        $selectors = [
            '//article',
            '//*[@id="content"]',
            '//*[@id="main-content"]',
            '//*[@id="article-content"]',
            '//*[contains(@class,"post-content")]',
            '//*[contains(@class,"article-content")]',
            '//*[contains(@class,"article-body")]',
            '//*[contains(@class,"entry-content")]',
            '//*[contains(@class,"content-detail")]',
            '//*[contains(@class,"detail-content")]',
            '//*[contains(@class,"news-content")]',
            '//*[contains(@class,"post-body")]',
            '//*[contains(@class,"story-body")]',
            '//*[contains(@class,"article__body")]',
            '//*[contains(@class,"job-description")]',
            '//*[contains(@class,"description")]',
            '//main',
        ];

        foreach ($selectors as $selector) {
            $nodes = $xpath->query($selector);
            if (!$nodes || $nodes->length === 0) continue;

            $raw = $this->innerHtml($nodes->item(0));
            if (mb_strlen(strip_tags($raw)) > 100) {
                return $this->cleanHtmlForEditor($raw);
            }
        }

        // ── 3. Paragraph fallback ─────────────────────────────────────────────
        $nodes = $xpath->query('//body//p');
        if ($nodes && $nodes->length > 0) {
            $parts = [];
            foreach ($nodes as $p) {
                $inner = $this->innerHtml($p);
                if (mb_strlen(trim(strip_tags($inner))) > 30) {
                    $parts[] = '<p>' . $inner . '</p>';
                }
            }
            if ($parts) {
                return $this->cleanHtmlForEditor(implode("\n", array_slice($parts, 0, 30)));
            }
        }

        return '';
    }

    /**
     * Convert JSON-LD description strings to clean HTML.
     * Handles: <br /> line breaks, **bold**, bullet lines starting with * or -
     */
    private function structureToHtml(string $text): string
    {
        // Already proper HTML (has block tags) — pass through
        if (preg_match('/<(p|h[1-6]|ul|ol|li)\b/i', $text)) {
            return $text;
        }

        // Normalise line breaks: <br />, <br/>, <br> → \n
        $text = preg_replace('/<br\s*\/?>/i', "\n", $text);

        // Decode HTML entities in the text
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Bold: **text** → <strong>text</strong>
        $text = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $text);

        $lines  = preg_split('/\r?\n/', $text);
        $html   = '';
        $inList = false;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                if ($inList) { $html .= "</ul>\n"; $inList = false; }
                continue;
            }

            if (preg_match('/^[*\-]\s+(.+)/u', $line, $m)) {
                if (!$inList) { $html .= "<ul>\n"; $inList = true; }
                $html .= '<li>' . trim($m[1]) . "</li>\n";
            } else {
                if ($inList) { $html .= "</ul>\n"; $inList = false; }
                $html .= '<p>' . $line . "</p>\n";
            }
        }
        if ($inList) $html .= "</ul>\n";

        return $html;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // DOMDocument helpers (only used as content fallback)
    // ═════════════════════════════════════════════════════════════════════════

    private function innerHtml(\DOMNode $node): string
    {
        $doc  = $node->ownerDocument;
        $html = '';
        foreach ($node->childNodes as $child) {
            $html .= $doc->saveHTML($child);
        }
        $html = preg_replace('/<(script|style|noscript)[^>]*>.*?<\/\1>/si', '', $html);
        $html = preg_replace('/<!--.*?-->/s', '', $html);
        $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim($html);
    }

    /**
     * Strip tags unsupported by Tiptap while keeping inner content.
     * Supported: p, h1-h6, strong/b, em/i, u, s, a, img, ul, ol, li,
     *            blockquote, pre, code, br, hr.
     */
    private function cleanHtmlForEditor(string $html): string
    {
        $unwrap = ['div', 'section', 'article', 'main', 'aside', 'header',
                   'footer', 'nav', 'figure', 'figcaption', 'picture', 'form', 'fieldset'];
        foreach ($unwrap as $tag) {
            $html = preg_replace('/<' . $tag . '(\s[^>]*)?>/i', '', $html);
            $html = preg_replace('/<\/' . $tag . '>/i', '', $html);
        }

        $html = preg_replace('/<(span|label|abbr|cite|time|mark|small|sub|sup)(\s[^>]*)?>/i', '', $html);
        $html = preg_replace('/<\/(span|label|abbr|cite|time|mark|small|sub|sup)>/i', '', $html);

        $allowed = '<p><h1><h2><h3><h4><h5><h6>'
            . '<strong><b><em><i><u><s><strike><del>'
            . '<a><img>'
            . '<ul><ol><li>'
            . '<blockquote><pre><code>'
            . '<br><hr>'
            . '<table><thead><tbody><tr><th><td>';

        $html = strip_tags($html, $allowed);
        $html = preg_replace('/(\s*\n){3,}/', "\n\n", $html);

        return trim($html);
    }

    private function resolveUrl(string $url, string $base): string
    {
        if (str_starts_with($url, 'http')) return $url;
        $parsed = parse_url($base);
        $scheme = $parsed['scheme'] ?? 'https';
        $host   = $parsed['host'] ?? '';
        if (str_starts_with($url, '//')) return $scheme . ':' . $url;
        return $scheme . '://' . $host . '/' . ltrim($url, '/');
    }
}
