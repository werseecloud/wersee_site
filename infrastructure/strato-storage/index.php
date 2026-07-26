<?php
declare(strict_types=1);

const JSON_FLAGS = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;

function respond(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_FLAGS);
    exit;
}

function fail(int $status, string $code, string $message): never
{
    respond($status, ['error' => ['code' => $code, 'message' => $message]]);
}

function headers_lower(): array
{
    $result = [];
    foreach ((function_exists('getallheaders') ? getallheaders() : []) as $name => $value) {
        $result[strtolower((string) $name)] = (string) $value;
    }
    return $result;
}

function token_from(array $headers): ?string
{
    $value = trim($headers['authorization'] ?? '');
    return str_starts_with($value, 'Bearer ') && trim(substr($value, 7)) !== ''
        ? trim(substr($value, 7))
        : null;
}

function supabase(
    array $config,
    string $method,
    string $path,
    ?string $token = null,
    ?array $body = null,
    array $extraHeaders = []
): array {
    $key = (string) $config['supabase_publishable_key'];
    $headers = [
        'apikey: ' . $key,
        'Authorization: Bearer ' . ($token ?: $key),
        'Accept: application/json',
        ...$extraHeaders,
    ];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
    }
    $curl = curl_init(rtrim((string) $config['supabase_url'], '/') . $path);
    if ($curl === false) {
        fail(503, 'UPSTREAM_UNAVAILABLE', 'The authorization service is unavailable.');
    }
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body, JSON_FLAGS));
    }
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($raw === false || $error !== '') {
        fail(503, 'UPSTREAM_UNAVAILABLE', 'The authorization service is unavailable.');
    }
    return [
        'status' => $status,
        'body' => $raw !== '' ? json_decode($raw, true) : null,
    ];
}

function require_user(array $config, ?string $token): array
{
    if ($token === null) {
        fail(401, 'AUTH_REQUIRED', 'Sign in to use Wersee storage.');
    }
    $result = supabase($config, 'GET', '/auth/v1/user', $token);
    if ($result['status'] !== 200 || !is_array($result['body']) || empty($result['body']['id'])) {
        fail(401, 'AUTH_INVALID', 'Your session is invalid or expired.');
    }
    return $result['body'];
}

function safe_bucket(string $bucket): string
{
    $bucket = trim($bucket);
    if ($bucket === '' || strlen($bucket) > 100 || preg_match('/[\x00-\x1F\x7F\/\\\\]/', $bucket)) {
        fail(400, 'INVALID_BUCKET', 'Use a valid bucket name.');
    }
    return $bucket;
}

function safe_path(string $path): string
{
    $path = trim(str_replace('\\', '/', $path), '/');
    if (
        $path === ''
        || strlen($path) > 900
        || str_contains($path, "\0")
        || preg_match('~(^|/)\.{1,2}(/|$)~', $path)
    ) {
        fail(400, 'INVALID_PATH', 'Use a safe, non-empty object path.');
    }
    foreach (explode('/', $path) as $segment) {
        if ($segment === '' || strlen($segment) > 180) {
            fail(400, 'INVALID_PATH', 'The path contains an invalid segment.');
        }
    }
    return $path;
}

function ensure_directory(string $directory): void
{
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        fail(507, 'STORAGE_WRITE_FAILED', 'The storage directory could not be created.');
    }
}

function bucket_configuration(array $config, string $bucket, string $token): array
{
    $path = '/rest/v1/storage_gateway_buckets?id=eq.' . rawurlencode($bucket)
        . '&select=id,public,file_size_limit,allowed_mime_types,enabled';
    $result = supabase($config, 'GET', $path, $token);
    $row = is_array($result['body']) ? ($result['body'][0] ?? null) : null;
    if ($result['status'] !== 200 || !is_array($row) || empty($row['enabled'])) {
        fail(403, 'BUCKET_NOT_ENABLED', 'This bucket is not enabled for STRATO storage.');
    }
    return $row;
}

function validate_upload(array $config, array $bucket, array $file): array
{
    if (
        (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
        || empty($file['tmp_name'])
        || !is_uploaded_file((string) $file['tmp_name'])
    ) {
        fail(400, 'UPLOAD_INVALID', 'The uploaded file could not be read.');
    }
    $size = (int) ($file['size'] ?? 0);
    $gatewayLimit = (int) ($config['max_upload_bytes'] ?? 0);
    $bucketLimit = isset($bucket['file_size_limit']) ? (int) $bucket['file_size_limit'] : 0;
    $limit = $bucketLimit > 0 ? min($gatewayLimit, $bucketLimit) : $gatewayLimit;
    if ($size <= 0 || ($limit > 0 && $size > $limit)) {
        fail(413, 'UPLOAD_TOO_LARGE', 'The file exceeds the configured upload limit.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file((string) $file['tmp_name'])
        ?: 'application/octet-stream';
    $allowed = $bucket['allowed_mime_types'] ?? null;
    if (is_array($allowed) && $allowed !== [] && !in_array($mime, $allowed, true)) {
        fail(415, 'MIME_NOT_ALLOWED', 'This file type is not allowed in this bucket.');
    }
    return ['size' => $size, 'mime' => $mime];
}

function object_metadata(array $config, string $id, ?string $token): ?array
{
    $path = '/rest/v1/storage_gateway_objects?id=eq.' . rawurlencode($id)
        . '&select=id,bucket_id,logical_path,storage_path,owner_id,visibility,mime_type,size_bytes,checksum_sha256,status,created_at,updated_at';
    $result = supabase($config, 'GET', $path, $token);
    $row = is_array($result['body']) ? ($result['body'][0] ?? null) : null;
    return $result['status'] === 200 && is_array($row) ? $row : null;
}

function stream_object(string $absolutePath, array $object): never
{
    if (!is_file($absolutePath)) {
        fail(404, 'OBJECT_MISSING', 'The object is not available on the storage node.');
    }
    $size = filesize($absolutePath);
    if ($size === false) {
        fail(500, 'OBJECT_READ_FAILED', 'The object could not be read.');
    }
    $start = 0;
    $end = max(0, $size - 1);
    $status = 200;
    if (
        !empty($_SERVER['HTTP_RANGE'])
        && preg_match('/^bytes=(\d*)-(\d*)$/', (string) $_SERVER['HTTP_RANGE'], $matches)
    ) {
        $requestedStart = $matches[1] === '' ? null : (int) $matches[1];
        $requestedEnd = $matches[2] === '' ? null : (int) $matches[2];
        $start = $requestedStart ?? max(0, $size - (int) $requestedEnd);
        if ($requestedEnd !== null) {
            $end = min($end, $requestedEnd);
        }
        if ($start < 0 || $start > $end || $start >= $size) {
            http_response_code(416);
            header('Content-Range: bytes */' . $size);
            exit;
        }
        $status = 206;
    }
    $length = $end - $start + 1;
    http_response_code($status);
    header('Content-Type: ' . ($object['mime_type'] ?: 'application/octet-stream'));
    header('Content-Length: ' . $length);
    header('Accept-Ranges: bytes');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: ' . (($object['visibility'] ?? '') === 'public'
        ? 'public, max-age=31536000, immutable'
        : 'private, no-store'));
    if ($status === 206) {
        header("Content-Range: bytes {$start}-{$end}/{$size}");
    }
    $handle = fopen($absolutePath, 'rb');
    if ($handle === false) {
        fail(500, 'OBJECT_READ_FAILED', 'The object could not be read.');
    }
    fseek($handle, $start);
    $remaining = $length;
    while ($remaining > 0 && !feof($handle)) {
        $chunk = fread($handle, min(1048576, $remaining));
        if ($chunk === false) {
            break;
        }
        echo $chunk;
        flush();
        $remaining -= strlen($chunk);
    }
    fclose($handle);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    fail(503, 'GATEWAY_NOT_CONFIGURED', 'Wersee storage is not configured.');
}
$config = require $configPath;
if (
    !is_array($config)
    || empty($config['supabase_url'])
    || empty($config['supabase_publishable_key'])
    || empty($config['storage_root'])
) {
    fail(503, 'GATEWAY_NOT_CONFIGURED', 'Wersee storage is not configured.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['allowed_origins'] ?? [];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: authorization, content-type, x-upsert');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 600');
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
        fail(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.');
    }
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$requestPath = preg_replace(
    '~/{2,}~',
    '/',
    parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
);
$headers = headers_lower();
$token = token_from($headers);
$storageRoot = rtrim((string) $config['storage_root'], '/\\');

if ($method === 'GET' && in_array($requestPath, ['/', '/health', '/v1/storage/health'], true)) {
    respond(200, [
        'ok' => true,
        'service' => 'wersee-strato-storage',
        'mode' => 'strato-write-supabase-fallback',
    ]);
}

if ($method === 'POST' && $requestPath === '/v1/storage/upload') {
    $user = require_user($config, $token);
    $bucketName = safe_bucket((string) ($_GET['bucket'] ?? ''));
    $logicalPath = safe_path((string) ($_GET['path'] ?? ''));
    $bucket = bucket_configuration($config, $bucketName, (string) $token);
    $file = $_FILES['file'] ?? null;
    if (!is_array($file)) {
        fail(400, 'FILE_REQUIRED', 'Send one multipart file using the field name "file".');
    }
    $validated = validate_upload($config, $bucket, $file);
    $visibility = !empty($bucket['public']) ? 'public' : 'private';
    $ownerId = (string) $user['id'];
    $bucketDirectory = rawurlencode($bucketName);
    $relativePath = "{$visibility}/{$bucketDirectory}/{$ownerId}/{$logicalPath}";
    $absolutePath = $storageRoot . DIRECTORY_SEPARATOR
        . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    ensure_directory(dirname($absolutePath));
    $upsert = filter_var($headers['x-upsert'] ?? ($_GET['upsert'] ?? false), FILTER_VALIDATE_BOOL);
    if (is_file($absolutePath) && !$upsert) {
        fail(409, 'OBJECT_EXISTS', 'An object already exists at this path.');
    }
    $temporaryPath = $storageRoot . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR
        . bin2hex(random_bytes(18)) . '.upload';
    ensure_directory(dirname($temporaryPath));
    if (!move_uploaded_file((string) $file['tmp_name'], $temporaryPath)) {
        fail(507, 'STORAGE_WRITE_FAILED', 'The file could not be written.');
    }
    $checksum = hash_file('sha256', $temporaryPath);
    if ($checksum === false || !rename($temporaryPath, $absolutePath)) {
        @unlink($temporaryPath);
        fail(507, 'STORAGE_WRITE_FAILED', 'The file could not be finalized.');
    }
    $metadata = [
        'bucket_id' => $bucketName,
        'logical_path' => $logicalPath,
        'storage_path' => $relativePath,
        'owner_id' => $ownerId,
        'provider' => 'strato',
        'visibility' => $visibility,
        'mime_type' => $validated['mime'],
        'size_bytes' => $validated['size'],
        'checksum_sha256' => $checksum,
        'status' => 'available',
    ];
    $result = supabase(
        $config,
        'POST',
        '/rest/v1/storage_gateway_objects?on_conflict=bucket_id,owner_id,logical_path',
        (string) $token,
        $metadata,
        ['Prefer: resolution=merge-duplicates,return=representation']
    );
    $stored = is_array($result['body']) ? ($result['body'][0] ?? null) : null;
    if ($result['status'] < 200 || $result['status'] >= 300 || !is_array($stored)) {
        @unlink($absolutePath);
        fail(500, 'METADATA_WRITE_FAILED', 'The file metadata could not be recorded.');
    }
    $stored['download_url'] = '/v1/storage/objects/' . $stored['id'];
    respond(201, ['object' => $stored]);
}

if ($method === 'GET' && $requestPath === '/v1/storage/objects') {
    require_user($config, $token);
    $bucketName = safe_bucket((string) ($_GET['bucket'] ?? ''));
    $prefix = trim(str_replace('\\', '/', (string) ($_GET['prefix'] ?? '')), '/');
    $query = '/rest/v1/storage_gateway_objects?bucket_id=eq.' . rawurlencode($bucketName)
        . '&status=eq.available'
        . '&select=id,bucket_id,logical_path,visibility,mime_type,size_bytes,checksum_sha256,status,created_at,updated_at'
        . '&order=logical_path.asc&limit=1000';
    if ($prefix !== '') {
        $query .= '&logical_path=like.' . rawurlencode($prefix . '*');
    }
    $result = supabase($config, 'GET', $query, $token);
    if ($result['status'] !== 200 || !is_array($result['body'])) {
        fail(502, 'METADATA_READ_FAILED', 'The storage listing could not be loaded.');
    }
    $objects = array_map(static function (array $row): array {
        $row['download_url'] = '/v1/storage/objects/' . $row['id'];
        return $row;
    }, $result['body']);
    respond(200, ['objects' => $objects]);
}

if (preg_match('~^/v1/storage/objects/([0-9a-fA-F-]{36})$~', $requestPath, $matches)) {
    $id = strtolower($matches[1]);
    if ($method === 'GET') {
        $object = object_metadata($config, $id, $token);
        if ($object === null) {
            fail(404, 'OBJECT_NOT_FOUND', 'The object was not found or you do not have access.');
        }
        if (($object['visibility'] ?? '') !== 'public') {
            require_user($config, $token);
        }
        $absolutePath = $storageRoot . DIRECTORY_SEPARATOR
            . str_replace('/', DIRECTORY_SEPARATOR, (string) $object['storage_path']);
        stream_object($absolutePath, $object);
    }
    if ($method === 'DELETE') {
        $user = require_user($config, $token);
        $object = object_metadata($config, $id, $token);
        if ($object === null || ($object['owner_id'] ?? '') !== ($user['id'] ?? '')) {
            fail(404, 'OBJECT_NOT_FOUND', 'The object was not found or you do not have access.');
        }
        $absolutePath = $storageRoot . DIRECTORY_SEPARATOR
            . str_replace('/', DIRECTORY_SEPARATOR, (string) $object['storage_path']);
        if (is_file($absolutePath) && !unlink($absolutePath)) {
            fail(507, 'OBJECT_DELETE_FAILED', 'The object could not be removed.');
        }
        $result = supabase(
            $config,
            'DELETE',
            '/rest/v1/storage_gateway_objects?id=eq.' . rawurlencode($id),
            (string) $token,
            null,
            ['Prefer: return=minimal']
        );
        if ($result['status'] < 200 || $result['status'] >= 300) {
            fail(500, 'METADATA_DELETE_FAILED', 'The object metadata could not be removed.');
        }
        http_response_code(204);
        exit;
    }
}

fail(404, 'ROUTE_NOT_FOUND', 'The requested storage route does not exist.');
