// ========================================
// ユーティリティ関数
// ========================================

// 純アルコール量を計算
function calculatePureAlcohol(volume, abv) {
    return parseFloat((volume * abv / 100 * 0.8).toFixed(1));
}

// 入力値をバリデーション
function validateInput(name, abv, volume) {
    if (!name || !abv || !volume) {
        return { valid: false, message: '全ての項目を入力してください' };
    }

    const abvNum = parseFloat(abv);
    if (isNaN(abvNum) || abvNum < 0 || abvNum > 100) {
        return { valid: false, message: 'アルコール度数は0〜100の範囲で入力してください' };
    }

    const volumeNum = parseFloat(volume);
    if (isNaN(volumeNum) || volumeNum < 1) {
        return { valid: false, message: '飲んだ量は1ml以上を入力してください' };
    }

    return { valid: true };
}

// XSS対策のHTMLエスケープ
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ========================================
// CardManager - データ管理
// ========================================
class CardManager {
    constructor() {
        this.cards = [];
        this.storageKey = 'pureAlcoholMeter_cards';
    }

    // ストレージから読み込み
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.cards = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('データの読み込みに失敗:', error);
            this.cards = [];
        }
    }

    // ストレージに保存
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cards));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new Error('保存容量が不足しています');
            }
            throw new Error('ブラウザのストレージが利用できません');
        }
    }

    // カード追加
    add(name, abv, volume) {
        const card = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name,
            abv: parseFloat(abv),
            volume: parseFloat(volume),
            pureAlcohol: calculatePureAlcohol(volume, abv),
            timestamp: Date.now()
        };

        this.cards.push(card);
        this.save();
        return card;
    }

    // カード削除
    delete(id) {
        this.cards = this.cards.filter(card => card.id !== id);
        this.save();
    }

    // 合計純アルコール量
    getTotal() {
        return this.cards.reduce((sum, card) => sum + card.pureAlcohol, 0);
    }
}

// ========================================
// UIManager - 画面表示管理
// ========================================
class UIManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.totalValue = document.getElementById('totalValue');
        this.cardContainer = document.getElementById('cardContainer');
    }

    // 合計表示を更新
    updateTotal() {
        this.totalValue.textContent = this.cardManager.getTotal().toFixed(1);
    }

    // カード要素を作成
    createCard(card) {
        const div = document.createElement('div');
        div.className = 'drink-card';
        div.dataset.id = card.id;
        div.innerHTML = `
            <div class="card-header">
                <div class="card-name">${escapeHtml(card.name)}</div>
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
                    <div class="detail-value highlight">${card.pureAlcohol}g</div>
                </div>
            </div>
        `;
        return div;
    }

    // 全カードを表示
    renderAll() {
        this.cardContainer.innerHTML = '';

        if (this.cardManager.cards.length === 0) {
            this.cardContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">まだ記録がありません</p>';
            return;
        }

        // 新しい順に表示
        for (let i = this.cardManager.cards.length - 1; i >= 0; i--) {
            this.cardContainer.appendChild(this.createCard(this.cardManager.cards[i]));
        }
    }

    // カードを追加
    addCard(card) {
        const emptyMsg = this.cardContainer.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        this.cardContainer.insertBefore(this.createCard(card), this.cardContainer.firstChild);
    }

    // カードを削除
    removeCard(id) {
        const card = this.cardContainer.querySelector(`[data-id="${id}"]`);
        if (card) card.remove();

        if (this.cardContainer.children.length === 0) {
            this.cardContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">まだ記録がありません</p>';
        }
    }
}

// ========================================
// App - アプリケーション
// ========================================
class App {
    constructor() {
        this.cardManager = new CardManager();
        this.ui = new UIManager(this.cardManager);
        this.errorMsg = document.getElementById('errorMessage');
        this.form = document.getElementById('drinkForm');
        this.errorTimeout = null;

        this.init();
    }

    init() {
        this.cardManager.load();
        this.ui.updateTotal();
        this.ui.renderAll();
        this.setupEvents();
    }

    setupEvents() {
        // フォーム送信
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('drinkName').value.trim();
            const abv = document.getElementById('abv').value;
            const volume = document.getElementById('volume').value;

            const validation = validateInput(name, abv, volume);
            if (!validation.valid) {
                this.showError(validation.message);
                return;
            }

            try {
                const card = this.cardManager.add(name, abv, volume);
                this.ui.addCard(card);
                this.ui.updateTotal();
                this.form.reset();
                this.hideError();
            } catch (error) {
                this.showError(error.message);
            }
        });

        // 削除ボタン
        this.ui.cardContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const id = e.target.dataset.id;
                this.cardManager.delete(id);
                this.ui.removeCard(id);
                this.ui.updateTotal();
            }
        });
    }

    showError(message) {
        this.errorMsg.textContent = message;
        this.errorMsg.classList.remove('hidden');

        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => this.hideError(), 3000);
    }

    hideError() {
        this.errorMsg.classList.add('hidden');
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => new App());
