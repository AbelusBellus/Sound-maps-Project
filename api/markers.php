<?php
// ============================================================
//  API для хранения маркеров городов в JSON-файлах
//  Поддерживает города: moscow, podolsk, nnovgorod
//  Использует: GET ?city=город&action=get  - получить маркеры
//              POST ?city=город&action=save - сохранить маркеры (требуется авторизация)
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight-запроса OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==================== КОНФИГУРАЦИЯ ====================
$allowedCities = ['moscow', 'podolsk', 'nnovgorod'];
$dataDir = __DIR__ . '/../data/';  // папка для JSON-файлов
$defaultPasswordHash = md5('INFJ'); // хэш пароля (для проверки авторизации)

// ==================== ПОЛУЧАЕМ ПАРАМЕТРЫ ====================
$city = $_GET['city'] ?? '';
$action = $_GET['action'] ?? '';

if (!in_array($city, $allowedCities)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid city']);
    exit;
}

$filePath = $dataDir . 'markers_' . $city . '.json';

// ==================== НАЧАЛЬНЫЕ МАРКЕРЫ (если файл отсутствует) ====================
function getDefaultMarkers($city) {
    // Здесь вы можете прописать начальные маркеры для каждого города
    // Эти данные будут использованы, если файл с маркерами ещё не создан
    switch ($city) {
        case 'moscow':
            return [
                ['lat' => 55.7558, 'lng' => 37.6173, 'title' => 'Красная площадь', 'soundUrl' => 'Sounds/Elpankotka.mp3', 'phase' => 'day', 'noiseParams' => ['radius' => 150, 'color' => 'hsla(0, 70%, 60%, 0.5)']],
                ['lat' => 55.7512, 'lng' => 37.6184, 'title' => 'Центр Москвы', 'soundUrl' => 'Sounds/Elpankotka.mp3', 'phase' => 'day', 'noiseParams' => ['radius' => 130, 'color' => 'hsla(30, 70%, 60%, 0.5)']],
                // ... добавьте остальные московские маркеры
            ];
case 'podolsk':
    return [
        [
            'lat' => 55.433056,
            'lng' => 37.563611,
            'title' => 'Екатерининский сквер',
            'soundUrl' => 'Sounds/ZOOM0012_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 120,
                'color' => 'hsla(200, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.441389,
            'lng' => 37.494444,
            'title' => 'Знаменская церковь',
            'soundUrl' => 'Sounds/ZOOM0006_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 130,
                'color' => 'hsla(30, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.420278,
            'lng' => 37.547778,
            'title' => 'Капитолий, Торговый центр',
            'soundUrl' => 'Sounds/ZOOM0022_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 110,
                'color' => 'hsla(60, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.418889,
            'lng' => 37.483611,
            'title' => 'Бульвар 65-летия Победы',
            'soundUrl' => 'Sounds/ZOOM0008_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 140,
                'color' => 'hsla(90, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.435833,
            'lng' => 37.551667,
            'title' => 'Мост над рекой Пахрой',
            'soundUrl' => 'Sounds/ZOOM0018_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 100,
                'color' => 'hsla(160, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.436944,
            'lng' => 37.564167,
            'title' => 'Рабочая улица',
            'soundUrl' => 'Sounds/ZOOM0013_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 90,
                'color' => 'hsla(200, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.440833,
            'lng' => 37.499167,
            'title' => 'Смотровая площадка',
            'soundUrl' => 'Sounds/ZOOM0007_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 160,
                'color' => 'hsla(240, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.431667,
            'lng' => 37.565278,
            'title' => 'Станция Подольск',
            'soundUrl' => 'Sounds/ZOOM0010_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 130,
                'color' => 'hsla(280, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.433611,
            'lng' => 37.546389,
            'title' => 'Троицкий собор',
            'soundUrl' => 'Sounds/ZOOM0020_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 150,
                'color' => 'hsla(320, 70%, 60%, 0.5)'
            ]
        ],
        [
            'lat' => 55.430659,
            'lng' => 37.545310,
            'title' => 'Памятник Ленину',
            'soundUrl' => 'Sounds/ZOOM0011_TrLR.WAV',
            'phase' => 'day',
            'noiseParams' => [
                'radius' => 110,
                'color' => 'hsla(50, 70%, 60%, 0.5)'
            ]
        ]
    ];
        case 'nnovgorod':
            return [
                ['lat' => 56.326, 'lng' => 44.006, 'title' => 'Нижегородский кремль', 'soundUrl' => 'Sounds/Elpankotka.mp3', 'phase' => 'day', 'noiseParams' => ['radius' => 150, 'color' => 'hsla(0, 70%, 60%, 0.5)']],
                // ... добавьте остальные маркеры для Н.Новгорода
            ];
        default:
            return [];
    }
}

// ==================== ОБРАБОТКА ЗАПРОСОВ ====================

// 1. GET – получить маркеры
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    if (file_exists($filePath)) {
        $data = file_get_contents($filePath);
        $markers = json_decode($data, true);
        if (is_array($markers)) {
            echo json_encode($markers);
            exit;
        }
    }
    // Если файла нет или он повреждён – возвращаем начальные маркеры
    $defaultMarkers = getDefaultMarkers($city);
    echo json_encode($defaultMarkers);
    exit;
}

// 2. POST – сохранить маркеры (только авторизованным)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save') {
    // Проверяем авторизацию (пароль из заголовка Authorization)
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    // Ожидаем, что клиент передаёт хэш пароля (MD5 от 'INFJ')
    // В JS вы можете передавать: headers: { 'Authorization': sessionStorage.getItem('adminHashPodolsk') }
    // где adminHashPodolsk = CryptoJS.MD5('INFJ').toString()
    if ($authHeader !== $defaultPasswordHash) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Получаем данные из тела запроса
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }

    // Сохраняем в файл
    if (file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write file']);
    }
    exit;
}

// Если ничего не подошло – 404
http_response_code(404);
echo json_encode(['error' => 'Invalid request']);
?>