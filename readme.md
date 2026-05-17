# money-pwa/api/list.php

```php
<?php

header('Content-Type: application/json');

try {

    $db = new PDO('sqlite:../db.sqlite');

    $db->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    /*
    |--------------------------------------------------------------------------
    | テーブル作成
    |--------------------------------------------------------------------------
    */

    $db->exec("
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL,
        memo TEXT,
        created_at TEXT NOT NULL
    )
    ");

    /*
    |--------------------------------------------------------------------------
    | 月取得
    |--------------------------------------------------------------------------
    */

    $month = $_GET['month'] ?? date('Y-m');

    /*
    |--------------------------------------------------------------------------
    | 一覧取得
    |--------------------------------------------------------------------------
    */

    $stmt = $db->prepare("
    SELECT *
    FROM records
    WHERE strftime('%Y-%m', created_at) = ?
    ORDER BY created_at DESC
    ");

    $stmt->execute([$month]);

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /*
    |--------------------------------------------------------------------------
    | 集計
    |--------------------------------------------------------------------------
    */

    $income = 0;
    $expense = 0;

    foreach ($records as $r) {

        if ($r['type'] === 'income') {
            $income += (int)$r['amount'];
        } else {
            $expense += (int)$r['amount'];
        }

    }

    echo json_encode([
        'success' => true,
        'month' => $month,
        'summary' => [
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense
        ],
        'records' => $records
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

}
```

---

# money-pwa/api/delete.php

```php
<?php

header('Content-Type: application/json');

try {

    $db = new PDO('sqlite:../db.sqlite');

    $db->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    /*
    |--------------------------------------------------------------------------
    | ID取得
    |--------------------------------------------------------------------------
    */

    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    $id = $data['id'] ?? null;

    if (!$id) {

        throw new Exception('IDがありません');

    }

    /*
    |--------------------------------------------------------------------------
    | 削除
    |--------------------------------------------------------------------------
    */

    $stmt = $db->prepare("
    DELETE FROM records
    WHERE id = ?
    ");

    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'deleted_id' => $id
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

}
```

---

# money-pwa/api/sync.php

```php
<?php

header('Content-Type: application/json');

try {

    $db = new PDO('sqlite:../db.sqlite');

    $db->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    /*
    |--------------------------------------------------------------------------
    | テーブル作成
    |--------------------------------------------------------------------------
    */

    $db->exec("
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL,
        memo TEXT,
        created_at TEXT NOT NULL
    )
    ");

    /*
    |--------------------------------------------------------------------------
    | データ取得
    |--------------------------------------------------------------------------
    */

    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!isset($data['records'])) {

        throw new Exception('records がありません');

    }

    $inserted = 0;

    /*
    |--------------------------------------------------------------------------
    | 同期処理
    |--------------------------------------------------------------------------
    */

    foreach ($data['records'] as $record) {

        /*
        |--------------------------------------------------------------------------
        | 重複確認
        |--------------------------------------------------------------------------
        */

        $check = $db->prepare("
        SELECT COUNT(*)
        FROM records
        WHERE
            type = ?
            AND category = ?
            AND amount = ?
            AND memo = ?
            AND created_at = ?
        ");

        $check->execute([
            $record['type'],
            $record['category'],
            $record['amount'],
            $record['memo'],
            $record['created_at']
        ]);

        $exists = $check->fetchColumn();

        if ($exists > 0) {
            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | 追加
        |--------------------------------------------------------------------------
        */

        $stmt = $db->prepare("
        INSERT INTO records (
            type,
            category,
            amount,
            memo,
            created_at
        )
        VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $record['type'],
            $record['category'],
            $record['amount'],
            $record['memo'],
            $record['created_at']
        ]);

        $inserted++;

    }

    echo json_encode([
        'success' => true,
        'inserted' => $inserted
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

}
```

---

# money-pwa/db.sqlite

SQLiteは「コードを書く」のではなく、
SQLiteデータベースファイルです。

---

# 作成方法

## 方法① 自動生成（おすすめ）

APIへアクセスすると自動作成されます。

```php
new PDO('sqlite:../db.sqlite');
```

これだけで：

```txt
db.sqlite
```

が自動生成されます。

---

# 方法② 手動作成

---

## Windows

空ファイル作成：

```txt
db.sqlite
```

---

## Linux

```bash
touch db.sqlite
```

---

# テーブル作成SQL

SQLiteツールで実行する場合。

```sql
CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    memo TEXT,
    created_at TEXT NOT NULL
);
```

---

# 推奨追加カラム

実用化するならかなり重要。

```sql
ALTER TABLE records
ADD COLUMN synced INTEGER DEFAULT 0;
```

---

# おすすめ追加構成

本格運用なら：

```txt
users
categories
budgets
notifications
settings
```

テーブル追加推奨。

---

# 次に実装すると強い機能

---

# ① 完全同期システム

- 差分同期
- 更新同期
- 削除同期
- 競合解決

---

# ② 認証

```txt
JWTログイン
```

---

# ③ Firebase Push通知

```txt
使いすぎ通知
```

---

# ④ レシートOCR

AI解析。

---

# ⑤ バックアップ

Google Drive同期。

---

# ⑥ 多端末同期

スマホ・PC連携。

---

# ⑦ 分析AI

```txt
食費が多いです
```

---

# ⑧ iPhone風UI

かなりアプリ感が出ます。
