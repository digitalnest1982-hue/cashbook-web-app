// Cashbook Web App - JavaScript
class CashbookApp {
    constructor() {
        this.transactions = this.loadTransactions();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderTransactions();
        this.updateCharts();
    }

    setupEventListeners() {
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', (e) => this.handleAddTransaction(e));
    }

    loadTransactions() {
        const stored = localStorage.getItem('cashbookTransactions');
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        localStorage.setItem('cashbookTransactions', JSON.stringify(this.transactions));
    }

    handleAddTransaction(e) {
        e.preventDefault();

        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        if (!type || !category || !amount || !date) {
            alert('Please fill all required fields');
            return;
        }

        const transaction = {
            id: Date.now(),
            type,
            category,
            amount,
            date,
            description
        };

        this.transactions.push(transaction);
        this.saveTransactions();

        // Reset form
        document.getElementById('transaction-form').reset();

        this.updateDashboard();
        this.renderTransactions();
        this.updateCharts();
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDashboard();
            this.renderTransactions();
            this.updateCharts();
        }
    }

    updateDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;

        this.transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        const balance = totalIncome - totalExpense;

        document.getElementById('balance').textContent = this.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);
    }

    renderTransactions() {
        const tbody = document.getElementById('transaction-body');
        const noTransactions = document.getElementById('no-transactions');

        if (this.transactions.length === 0) {
            tbody.innerHTML = '';
            noTransactions.style.display = 'block';
            return;
        }

        noTransactions.style.display = 'none';

        // Sort by date (newest first)
        const sorted = [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = sorted.map(t => `
            <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td><span class="badge ${t.type}">${t.type.toUpperCase()}</span></td>
                <td>${t.category}</td>
                <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}</td>
                <td>${t.description || '-'}</td>
                <td>
                    <button class="btn-delete" onclick="app.deleteTransaction(${t.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    updateCharts() {
        this.updateCategoryChart();
        this.updateMonthlyChart();
    }

    updateCategoryChart() {
        const expensesByCategory = {};

        this.transactions.forEach(t => {
            if (t.type === 'expense') {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            }
        });

        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);

        const ctx = document.getElementById('categoryChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.categoryChartInstance) {
            this.categoryChartInstance.destroy();
        }

        this.categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.length > 0 ? categories : ['No Data'],
                datasets: [{
                    data: amounts.length > 0 ? amounts : [1],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe',
                        '#43e97b',
                        '#fa709a',
                        '#fee140',
                        '#30cfd0'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateMonthlyChart() {
        const monthlyData = {};

        this.transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { year: 'numeric', month: 'short' });
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                monthlyData[month].income += t.amount;
            } else {
                monthlyData[month].expense += t.amount;
            }
        });

        const months = Object.keys(monthlyData);
        const incomeData = months.map(m => monthlyData[m].income);
        const expenseData = months.map(m => monthlyData[m].expense);

        const ctx = document.getElementById('monthlyChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.monthlyChartInstance) {
            this.monthlyChartInstance.destroy();
        }

        this.monthlyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.length > 0 ? months : ['No Data'],
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData.length > 0 ? incomeData : [0],
                        backgroundColor: '#38ef7d',
                        borderColor: '#11998e',
                        borderWidth: 1
                    },
                    {
                        label: 'Expense',
                        data: expenseData.length > 0 ? expenseData : [0],
                        backgroundColor: '#ff6a00',
                        borderColor: '#ee0979',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CashbookApp();
});