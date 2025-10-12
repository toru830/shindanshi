// 診断士過去問アプリのメインJavaScript

class DiagnosisApp {
    constructor() {
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.filteredQuestions = [];
        this.userAnswers = [];
        this.isAnswered = false;
        this.showAnswer = false;
        this.selectedSubject = 'all';
        this.selectedYear = '';
        this.selectedCoverSubject = '';
        this.selectedCoverYear = '';
        
        this.initializeApp();
    }

    // アプリの初期化
    async initializeApp() {
        await this.loadQuestions();
        this.filterQuestions(); // 初期フィルタリング
        this.setupEventListeners();
        this.showCoverScreen(); // 表紙画面を表示
    }

    // 過去問データの読み込み
    async loadQuestions() {
        try {
            // JSONファイルから問題を読み込み（キャッシュを無効化）
            const response = await fetch('questions.json?' + new Date().getTime());
            if (!response.ok) {
                throw new Error('問題データの読み込みに失敗しました');
            }
            const data = await response.json();
            this.questions = data.questions;
            
            console.log('読み込まれた問題数:', this.questions.length);
            console.log('第1問:', this.questions[0]);
            
            // 問題が読み込まれなかった場合はサンプル問題を使用
            if (!this.questions || this.questions.length === 0) {
                this.loadSampleQuestions();
            }
        } catch (error) {
            console.warn('JSONファイルの読み込みに失敗しました。サンプル問題を使用します。', error);
            this.loadSampleQuestions();
        }
    }

    // サンプル問題の読み込み（フォールバック用）
    loadSampleQuestions() {
        this.questions = [
            {
                id: 1,
                year: 2023,
                subject: "経営学",
                text: "中小企業診断士の役割について、最も適切なものはどれか。",
                options: [
                    "中小企業の経営課題を分析し、改善提案を行う専門家",
                    "中小企業の財務管理のみを担当する専門家",
                    "中小企業の人事管理のみを担当する専門家",
                    "中小企業の法務業務のみを担当する専門家"
                ],
                correct: 1,
                explanation: "中小企業診断士は、中小企業の経営全般にわたる課題を分析し、経営改善のための総合的な提案を行う専門家です。財務、人事、法務など特定の分野に限定されません。"
            },
            {
                id: 2,
                year: 2023,
                subject: "経営学",
                text: "中小企業の経営戦略において、SWOT分析の「S」は何を表すか。",
                options: [
                    "Strength（強み）",
                    "Strategy（戦略）",
                    "Structure（構造）",
                    "System（システム）"
                ],
                correct: 1,
                explanation: "SWOT分析の「S」はStrength（強み）を表します。SWOT分析は、Strengths（強み）、Weaknesses（弱み）、Opportunities（機会）、Threats（脅威）の4つの要素を分析するフレームワークです。"
            }
        ];
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 表紙画面のイベント
        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCoverSubject(e.target.dataset.subject));
        });
        
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCoverYear(e.target.dataset.year));
        });
        
        document.getElementById('start-quiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('back-to-cover').addEventListener('click', () => this.showCoverScreen());

        // 選択肢クリック
        document.getElementById('options-container').addEventListener('click', (e) => {
            const option = e.target.closest('.option');
            if (option && !this.isAnswered) {
                this.selectOption(option);
            }
        });

        // 科目フィルター
        document.getElementById('subject-select').addEventListener('change', (e) => {
            this.selectedSubject = e.target.value;
            this.filterQuestions();
        });

        // ボタンイベント
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('answer-btn').addEventListener('click', () => this.showAnswerExplanation());
        document.getElementById('continue-btn').addEventListener('click', () => this.continueToNext());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartQuiz());
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeModal());
    }

    // 表紙画面の表示
    showCoverScreen() {
        document.getElementById('cover-screen').style.display = 'flex';
        document.getElementById('question-screen').style.display = 'none';
    }

    // 科目選択
    selectCoverSubject(subject) {
        this.selectedCoverSubject = subject;
        
        // ボタンの選択状態を更新
        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-subject="${subject}"]`).classList.add('selected');
        
        // 年度選択を表示
        document.getElementById('year-selection').style.display = 'block';
    }

    // 年度選択
    selectCoverYear(year) {
        this.selectedCoverYear = year;
        
        // ボタンの選択状態を更新
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-year="${year}"]`).classList.add('selected');
        
        // 開始ボタンを表示
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('start-quiz').disabled = false;
    }

    // クイズ開始
    startQuiz() {
        // 表紙画面を非表示、問題画面を表示
        document.getElementById('cover-screen').style.display = 'none';
        document.getElementById('question-screen').style.display = 'block';
        
        // 選択された科目と年度でフィルタリング
        this.selectedSubject = this.selectedCoverSubject;
        this.selectedYear = this.selectedCoverYear;
        this.filterQuestions();
    }

    // 選択肢の選択
    selectOption(optionElement) {
        // 既存の選択をクリア
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        
        // 新しい選択を設定
        optionElement.classList.add('selected');
        
        // 選択した選択肢の番号を保存
        const optionNumber = parseInt(optionElement.dataset.option);
        this.userAnswers[this.currentQuestionIndex] = optionNumber;
        
        // 自動で正解・不正解表示と解説表示
        this.showAnswerExplanation();
    }

    // 問題のフィルタリング
    filterQuestions() {
        if (this.selectedSubject === 'all') {
            this.filteredQuestions = [...this.questions];
        } else {
            this.filteredQuestions = this.questions.filter(q => q.subject === this.selectedSubject);
        }
        
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.displayQuestion();
        this.updateProgress();
    }

    // 問題の表示
    displayQuestion() {
        const question = this.filteredQuestions[this.currentQuestionIndex];
        
        // 問題情報の更新
        document.getElementById('question-num').textContent = question.id;
        document.getElementById('question-text').textContent = question.text;
        document.querySelector('.question-year').textContent = `${question.year}年`;
        document.getElementById('question-subject').textContent = question.subject;
        
        // 図表の表示
        const questionImage = document.getElementById('question-image');
        const questionImg = document.getElementById('question-img');
        
        if (question.image) {
            questionImg.src = question.image;
            questionImg.alt = `問題${question.id}の図表`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }
        
        // 選択肢の更新
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            option.classList.remove('selected', 'correct', 'incorrect');
            if (question.options[index]) {
                option.querySelector('.option-text').textContent = question.options[index];
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
        
        // 解答・解説エリアを非表示
        document.getElementById('answer-container').style.display = 'none';
        document.getElementById('answer-btn').style.display = 'none';
        document.getElementById('continue-btn').style.display = 'none';
        
        // 状態のリセット
        this.isAnswered = false;
        this.showAnswer = false;
    }

    // 進捗の更新
    updateProgress() {
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.filteredQuestions.length;
        
        // 前の問題ボタンの状態
        document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;
        
        // 次の問題ボタンの状態
        const isLastQuestion = this.currentQuestionIndex === this.filteredQuestions.length - 1;
        document.getElementById('next-btn').style.display = isLastQuestion ? 'none' : 'block';
    }

    // 次の問題
    nextQuestion() {
        if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    // 前の問題
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    // 解答・解説の表示
    showAnswerExplanation() {
        if (this.isAnswered) return;
        
        const question = this.filteredQuestions[this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        
        // 選択肢の正解・不正解の表示
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            option.classList.remove('selected');
            if (index + 1 === question.correct) {
                option.classList.add('correct');
            } else if (index + 1 === userAnswer && userAnswer !== question.correct) {
                option.classList.add('incorrect');
            }
        });
        
        // 解答・解説の表示
        const answerLabels = ['ア', 'イ', 'ウ', 'エ', 'オ'];
        document.getElementById('correct-answer').textContent = answerLabels[question.correct - 1];
        document.getElementById('explanation').textContent = question.explanation;
        document.getElementById('answer-container').style.display = 'block';
        
        // ボタンの切り替え
        document.getElementById('answer-btn').style.display = 'none';
        document.getElementById('continue-btn').style.display = 'block';
        
        this.isAnswered = true;
        this.showAnswer = true;
    }

    // 続行ボタン
    continueToNext() {
        if (this.currentQuestionIndex === this.filteredQuestions.length - 1) {
            this.showResults();
        } else {
            this.nextQuestion();
        }
    }

    // 結果の表示
    showResults() {
        const correctCount = this.calculateScore();
        const percentage = Math.round((correctCount / this.filteredQuestions.length) * 100);
        
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('total-count').textContent = this.filteredQuestions.length;
        document.getElementById('percentage').textContent = percentage;
        
        document.getElementById('result-modal').style.display = 'flex';
    }

    // スコアの計算
    calculateScore() {
        let correctCount = 0;
        this.filteredQuestions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correct) {
                correctCount++;
            }
        });
        return correctCount;
    }

    // モーダルの閉じる
    closeModal() {
        document.getElementById('result-modal').style.display = 'none';
    }

    // クイズの再開
    restartQuiz() {
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.isAnswered = false;
        this.showAnswer = false;
        
        document.getElementById('result-modal').style.display = 'none';
        this.filterQuestions();
    }
}

// アプリの初期化
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DiagnosisApp();
    await app.initializeApp();
});
