// ========================================
// AlcoholCalculator - 純アルコール量計算
// ========================================
class AlcoholCalculator {
    static calculatePureAlcohol(volume, abv) {
        return parseFloat((volume * abv / 100).toFixed(1));
    }
}


// ========================================
// StorageManager - LocalStorage管理
// ========================================
class StorageManager {
    static STORAGE_KEY = 'pureAlcoholMeter_cards';

    static saveCards(cards) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new Error('保存容量が不足しています。古いデータを削除してください');
            }
            throw new Error('ブラウザのストレージが利用できません。プライベートモードを解除してください');
        }
    }

    static loadCards() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return [];
        }
    }

    static clearCards() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('データの削除に失敗しました:', error);
            return false;
        }
    }
}


// ========================================
// CardManager - カード管理
// ========================================
class CardManager {
    constructor() {
        this.cards = [];
    }

    // UUID生成（簡易版）
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // カード追加
    addCard(name, abv, volume) {
        const pureAlcohol = AlcoholCalculator.calculatePureAlcohol(volume, abv);
        const card = {
            id: this.generateId(),
            name: name,
            abv: parseFloat(abv),
            volume: parseFloat(volume),
            pureAlcohol: pureAlcohol,
            timestamp: Date.now()
        };
        
        this.cards.push(card);
        StorageManager.saveCards(this.cards);
        return card;
    }

    // カード削除
    deleteCard(id) {
        this.cards = this.cards.filter(card => card.id !== id);
        StorageManager.saveCards(this.cards);
    }

    // 全カード取得
    getAllCards() {
        return this.cards;
    }

    // 合計純アルコール量計算
    getTotalPureAlcohol() {
        return this.cards.reduce((total, card) => total + card.pureAlcohol, 0);
    }

    // データ読み込み
    loadFromStorage() {
        this.cards = StorageManager.loadCards();
    }
}


// ========================================
// UIManager - UI描画管理
// ========================================
class UIManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.totalValueElement = document.getElementById('totalValue');
        this.cardContainer = document.getElementById('cardContainer');
        this.errorMessageElement = document.getElementById('errorMessage');
    }

    // 合計表示を更新
    updateTotalDisplay() {
        const total = this.cardManager.getTotalPureAlcohol();
        this.totalValueElement.textContent = total.toFixed(1);
    }


    // テキストをエスケープ（XSS対策）
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // カード要素を作成
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'drink-card';
        cardDiv.dataset.id = card.id;

        cardDiv.innerHTML = `
            <div class="card-header">
                <div class="card-name">${this.escapeHtml(card.name)}</div>
                <button class="btn-delete" data-id="${card.id}">削除</button>
            </div>
            <div class="card-details">
                <div class="card-detail">
                    <div class="detail-label">アルコール度数</div>
                    <div class="detail-value">${card.abv}%</div>
                </div>
                <div class="card-detail">
                    <div class="detail-label">飲んだ量</div>
                    <div class="detail-value">${card.volume}ml</div>
                </div>
                <div class="card-detail">
                    <div class="detail-label">純アルコール量</div>
                    <div class="detail-value highlight">${card.pureAlcohol}ml</div>
                </div>
            </div>
        `;

        return cardDiv;
    }

    // カードリスト全体を描画
    renderCards() {
        this.cardContainer.innerHTML = '';
        const cards = this.cardManager.getAllCards();
        
        if (cards.length === 0) {
            this.cardContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">まだ記録がありません</p>';
            return;
        }

        // 新しい順に表示
        cards.reverse().forEach(card => {
            const cardElement = this.createCardElement(card);
            this.cardContainer.appendChild(cardElement);
        });
    }


    // 画面全体を更新
    render() {
        this.updateTotalDisplay();
        this.renderCards();
    }
}


// ========================================
// Validator - 入力バリデーション
// ========================================
class Validator {
    static validate(name, abv, volume) {
        // 全フィールド必須チェック
        if (!name || !abv || !volume) {
            return { valid: false, message: '全ての項目を入力してください' };
        }

        // ABV範囲チェック
        const abvNum = parseFloat(abv);
        if (isNaN(abvNum) || abvNum < 0 || abvNum > 100) {
            return { valid: false, message: 'アルコール度数は0〜100の範囲で入力してください' };
        }

        // 飲んだ量の正数チェック
        const volumeNum = parseFloat(volume);
        if (isNaN(volumeNum) || volumeNum < 1) {
            return { valid: false, message: '飲んだ量は1ml以上を入力してください' };
        }

        return { valid: true };
    }
}


// ========================================
// ErrorHandler - エラー表示管理
// ========================================
class ErrorHandler {
    constructor(errorElement) {
        this.errorElement = errorElement;
        this.timeoutId = null;
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.classList.remove('hidden');

        // 既存のタイマーをクリア
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // 3秒後に自動消去
        this.timeoutId = setTimeout(() => {
            this.hideError();
        }, 3000);
    }

    hideError() {
        this.errorElement.classList.add('hidden');
    }
}


// ========================================
// App - アプリケーション本体
// ========================================
class App {
    constructor() {
        this.cardManager = new CardManager();
        this.uiManager = new UIManager(this.cardManager);
        this.errorHandler = new ErrorHandler(document.getElementById('errorMessage'));
        this.form = document.getElementById('drinkForm');
        
        this.init();
    }

    init() {
        // データ読み込み
        this.cardManager.loadFromStorage();
        this.uiManager.render();

        // イベントリスナー設定
        this.setupEventListeners();
    }

    setupEventListeners() {
        // フォーム送信
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // 削除ボタン（イベント委譲）
        this.uiManager.cardContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                this.handleDelete(e.target.dataset.id);
            }
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('drinkName').value.trim();
        const abv = document.getElementById('abv').value;
        const volume = document.getElementById('volume').value;

        // バリデーション
        const validation = Validator.validate(name, abv, volume);
        if (!validation.valid) {
            this.errorHandler.showError(validation.message);
            return;
        }

        try {
            // カード追加
            this.cardManager.addCard(name, abv, volume);
            
            // 画面更新
            this.uiManager.render();
            
            // フォームリセット
            this.form.reset();
            
            // エラーメッセージを非表示
            this.errorHandler.hideError();
        } catch (error) {
            this.errorHandler.showError(error.message);
        }
    }


    handleDelete(id) {
        this.cardManager.deleteCard(id);
        this.uiManager.render();
    }
}


// ========================================
// アプリケーション起動
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
