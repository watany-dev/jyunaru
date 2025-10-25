# 要件定義書

## はじめに

純アルメーターは、飲酒量を簡単に記録・計測するためのWebアプリケーションです。酔っている状態でも操作できるよう、シンプルなカード形式のUIで飲んだお酒の情報を登録し、純アルコール量を自動計算して表示します。

## 用語集

- **System**: 純アルメーターアプリケーション
- **User**: アプリケーションを使用する飲酒者
- **DrinkCard**: お酒の情報（名前、アルコール度数、飲んだ量）を記録するカード
- **ABV**: Alcohol By Volume（アルコール度数）をパーセントで表した値
- **PureAlcohol**: 純アルコール量（ml単位）

## 要件

### 要件1

**ユーザーストーリー:** ユーザーとして、飲んだお酒の情報を簡単に登録したい。酔っていても操作できるようシンプルなUIが必要。

#### 受入基準

1. WHEN Userが新規登録ボタンをタップする, THEN THE System SHALL 入力フォームを表示する
2. THE System SHALL お酒の名前入力フィールドを提供する
3. THE System SHALL ABV入力フィールドを提供する
4. THE System SHALL 飲んだ量（ml）入力フィールドを提供する
5. THE System SHALL 大きなタップ領域を持つ保存ボタンを提供する

### 要件2

**ユーザーストーリー:** ユーザーとして、登録した飲酒記録をカード形式で一覧表示したい。各カードで情報を確認できるようにしたい。

#### 受入基準

1. THE System SHALL 登録された全てのDrinkCardをリスト形式で表示する
2. WHEN DrinkCardが表示される, THEN THE System SHALL お酒の名前を表示する
3. WHEN DrinkCardが表示される, THEN THE System SHALL ABVを表示する
4. WHEN DrinkCardが表示される, THEN THE System SHALL 飲んだ量（ml）を表示する
5. WHEN DrinkCardが表示される, THEN THE System SHALL 計算された純アルコール量（ml）を表示する

### 要件3

**ユーザーストーリー:** ユーザーとして、今日飲んだ純アルコール量の合計を確認したい。健康管理のため総量を把握したい。

#### 受入基準

1. THE System SHALL 全てのDrinkCardの純アルコール量を合計する
2. THE System SHALL 合計純アルコール量を画面上部に大きく表示する
3. WHEN 新しいDrinkCardが追加される, THEN THE System SHALL 合計値を自動的に更新する
4. WHEN DrinkCardが削除される, THEN THE System SHALL 合計値を自動的に更新する

### 要件4

**ユーザーストーリー:** ユーザーとして、誤って登録したカードを削除したい。間違った入力を修正できるようにしたい。

#### 受入基準

1. WHEN DrinkCardが表示される, THEN THE System SHALL 削除ボタンを提供する
2. WHEN Userが削除ボタンをタップする, THEN THE System SHALL 該当するDrinkCardを削除する
3. WHEN DrinkCardが削除される, THEN THE System SHALL 画面表示を即座に更新する

### 要件5

**ユーザーストーリー:** ユーザーとして、純アルコール量が自動計算されることを期待する。計算ミスを防ぎたい。

#### 受入基準

1. THE System SHALL 純アルコール量を「飲んだ量（ml）× ABV ÷ 100」の式で計算する
2. WHEN Userが飲んだ量とABVを入力する, THEN THE System SHALL 純アルコール量を自動計算する
3. THE System SHALL 計算結果を小数点第1位まで表示する
4. WHERE ABVが0から100の範囲外である, THE System SHALL エラーメッセージを表示する
5. WHERE 飲んだ量が0以下である, THE System SHALL エラーメッセージを表示する

### 要件6

**ユーザーストーリー:** ユーザーとして、データがブラウザに保存されることを期待する。ページをリロードしても記録が残っていてほしい。

#### 受入基準

1. THE System SHALL DrinkCardデータをブラウザのローカルストレージに保存する
2. WHEN Userがページをリロードする, THEN THE System SHALL 保存されたDrinkCardを復元する
3. WHEN 新しいDrinkCardが追加される, THEN THE System SHALL データをローカルストレージに永続化する
4. WHEN DrinkCardが削除される, THEN THE System SHALL ローカルストレージを更新する
