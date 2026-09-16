<?php
declare(strict_types=1);

/**
 * DESAN KONVEYÖR - PHP 8.3 B2B Backend API
 * Compatible with PHP 8.3.0+
 *
 * Firma: DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbFile = __DIR__ . '/desan_db.json';

function getDbData(string $file): array {
    if (!file_exists($file)) {
        return ['cariler' => [], 'teklifler' => []];
    }
    $fp = @fopen($file, 'rb');
    if (!$fp) {
        return ['cariler' => [], 'teklifler' => []];
    }
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return json_decode($content ?: '{}', true) ?: ['cariler' => [], 'teklifler' => []];
}

function saveDbData(string $file, array $data): bool {
    $fp = @fopen($file, 'c+b');
    if (!$fp) {
        return false;
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }
    ftruncate($fp, 0);
    rewind($fp);
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = fwrite($fp, $encoded ?: '') !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawInput = file_get_contents('php://input') ?: '{}';
$input = json_decode($rawInput, true) ?: [];

try {
    match ($action) {
        'get_db' => (function() use ($dbFile) {
            echo json_encode(['success' => true, 'data' => getDbData($dbFile)]);
        })(),

        'save_quote' => (function() use ($dbFile, $input) {
            $db = getDbData($dbFile);
            $quote = $input['quote'] ?? null;
            if (!$quote) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Geçersiz teklif verisi.']);
                return;
            }
            $quote['id'] = 'PRF-' . date('Ymd-His') . '-' . rand(100, 999);
            $quote['created_at'] = date('c');
            $db['teklifler'][] = $quote;
            saveDbData($dbFile, $db);
            echo json_encode(['success' => true, 'message' => 'Teklif başarıyla kaydedildi.', 'quote_id' => $quote['id']]);
        })(),

        'register_cari' => (function() use ($dbFile, $input) {
            $db = getDbData($dbFile);
            $cari = $input['cari'] ?? null;
            if (!$cari || empty($cari['company_name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Firma unvanı zorunludur.']);
                return;
            }
            $db['cariler'][] = $cari;
            saveDbData($dbFile, $db);
            echo json_encode(['success' => true, 'message' => 'Cari kaydı başarıyla oluşturuldu.']);
        })(),

        default => (function() {
            echo json_encode([
                'status' => 'online',
                'engine' => 'PHP ' . PHP_VERSION,
                'company' => 'DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ.',
                'system' => 'DESAN KONVEYÖR B2B API v1.0',
                'time' => date('Y-m-d H:i:s')
            ]);
        })()
    };
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
