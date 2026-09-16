<?php
declare(strict_types=1);

/**
 * DESAN KONVEYÖR - PHP 8.3 Web Server Router & Asset Handler
 * PHP Engine Compatibility: PHP 8.3.0+
 *
 * Firma: DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ.
 * Web: https://www.desanmakina.net
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = urldecode($uri);

// Security Headers for PHP 8.3
header('X-Powered-By: PHP/8.3 (Desan Konveyör Engine)');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Direct asset handler for PHP internal server or servers without mod_rewrite
$filePath = __DIR__ . $uri;
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeType = match ($ext) {
        'css'  => 'text/css; charset=UTF-8',
        'js'   => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'png'  => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'svg'  => 'image/svg+xml',
        'webp' => 'image/webp',
        'pdf'  => 'application/pdf',
        'woff2'=> 'font/woff2',
        default => mime_content_type($filePath) ?: 'application/octet-stream'
    };
    header("Content-Type: {$mimeType}");
    readfile($filePath);
    exit;
}

// Route: Admin / Yönetim Panel
if (str_starts_with($uri, '/yonetim') || str_starts_with($uri, '/admin')) {
    $adminPath = file_exists(__DIR__ . '/dist/yonetim.html') ? __DIR__ . '/dist/yonetim.html' : __DIR__ . '/yonetim.html';
    if (file_exists($adminPath)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($adminPath);
        exit;
    }
}

// Route: Main SPA Application
$indexPath = file_exists(__DIR__ . '/dist/index.html') ? __DIR__ . '/dist/index.html' : __DIR__ . '/index.html';

if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexPath);
    exit;
}

http_response_code(404);
echo "<!DOCTYPE html><html lang='tr'><head><meta charset='UTF-8'><title>404 - Sayfa Bulunamadı</title></head><body style='font-family:sans-serif; text-align:center; padding:50px;'><h1>404 - Sayfa Bulunamadı</h1><p>Desan Konveyör sunucu yanıtı.</p></body></html>";
