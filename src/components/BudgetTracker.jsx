import { useState, useEffect, useRef, useContext } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    PlusCircle, Trash2, DollarSign, TrendingDown,
    TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon
} from 'lucide-react';
import * as d3 from 'd3';
import Cards from './Cards';
import { createCategories, deleteCategories, getAllCategories } from '../proxy/CategoryProxy';
import { createBudget, getAllBudget, updateBudget } from '../proxy/BudgetProxy';
import { createTransaction, deleteTransaction, getAllTransaction } from '../proxy/TransactionProxy';
import { AuthContext } from '../App';

// Sample Data
const initialCategories = [
    { id: 1, name: 'Salary', type: 'income' },
    { id: 2, name: 'Freelance', type: 'income' },
    { id: 3, name: 'Groceries', type: 'expense' },
    { id: 4, name: 'Rent', type: 'expense' },
    { id: 5, name: 'Utilities', type: 'expense' },
    { id: 6, name: 'Entertainment', type: 'expense' },
    { id: 7, name: 'Transportation', type: 'expense' },
];

const initialTransactions = [
    { id: 1, description: 'Monthly Salary', amount: 5000, categoryId: 1, date: '2025-05-01' },
    { id: 2, description: 'Website Project', amount: 1200, categoryId: 2, date: '2025-05-02' },
    { id: 3, description: 'Weekly Groceries', amount: 150, categoryId: 3, date: '2025-05-03' },
    { id: 4, description: 'May Rent', amount: 1800, categoryId: 4, date: '2025-05-01' },
    { id: 5, description: 'Electricity Bill', amount: 120, categoryId: 5, date: '2025-05-04' },
    { id: 6, description: 'Movie Night', amount: 50, categoryId: 6, date: '2025-05-05' },
    { id: 7, description: 'Gas', amount: 60, categoryId: 7, date: '2025-05-06' },
];

const initialBudgets = [
    { id: 3, categoryId: 3, amount: 600 },
    { id: 4, categoryId: 4, amount: 1800 },
    { id: 5, categoryId: 5, amount: 200 },
    { id: 6, categoryId: 6, amount: 300 },
    { id: 7, categoryId: 7, amount: 200 },
];

// Color schemes
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const INCOME_COLOR = '#4ade80';
const EXPENSE_COLOR = '#f87171';

export default function BudgetTracker() {
    const { logout } = useContext(AuthContext);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);

    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().slice(0, 10)
    });
    const [newBudget, setNewBudget] = useState({ categoryId: '', amount: '' });

    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [chartType, setChartType] = useState('pie');

    const chartRef = useRef(null);

    useEffect(() => {
        fetchCategories();
        fetchBudget();
    }, [])

    useEffect(() => {
        fetchTransactions();
    }, [page])

    const fetchCategories = async () => {
        let data = await getAllCategories();
        if (data) {
            setCategories(data ?? []);
        }
    }

    const fetchBudget = async () => {
        let data = await getAllBudget();

        if (data) {
            setBudgets(data ?? []);
        }
    }

    const fetchTransactions = async () => {
        let data = await getAllTransaction(page);

        if (data.results) {
            setTransactions(data.results ?? []);
            setCount(data.count);
            setNext(data.next);
            setPrev(data.previous)
        }
    }

    // Calculate financial summary
    const totalIncome = transactions
        .filter(transaction => {
            const category = categories.find(cat => cat.id === transaction.categoryId);
            return category && category.type === 'income';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => {
            const category = categories.find(cat => cat.id === transaction.categoryId);
            return category && category.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Prepare chart data
    const expensesChartData = categories
        .filter(category => category.type === 'expense')
        .map(category => {
            const totalAmount = transactions
                .filter(t => t.categoryId === category.id)
                .reduce((sum, t) => sum + t.amount, 0);

            const budgetAmount = budgets.find(b => b.categoryId === category.id)?.amount || 0;

            return {
                name: category.name,
                spent: totalAmount,
                budget: budgetAmount,
            };
        })
        .filter(item => item.spent > 0 || item.budget > 0);

    const expensesByCategoryData = categories
        .filter(category => category.type === 'expense')
        .map(category => {
            const totalAmount = transactions
                .filter(t => t.categoryId === category.id)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: category.name,
                value: totalAmount,
            };
        })
        .filter(item => item.value > 0);

    const incomeByCategoryData = categories
        .filter(category => category.type === 'income')
        .map(category => {
            const totalAmount = transactions
                .filter(t => t.categoryId === category.id)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: category.name,
                value: totalAmount,
            };
        })
        .filter(item => item.value > 0);

    useEffect(() => {
        if (!chartRef.current) return;

        // Clear any existing chart
        d3.select(chartRef.current).selectAll("*").remove();

        const container = chartRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 30, bottom: 80, left: 40 };  // Adjusted bottom margin for horizontal legend
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        if (chartType === 'pie') {
            const radius = Math.min(innerWidth, innerHeight) / 2;

            const pieData = expensesByCategoryData.filter(d => d.value > 0);

            const pie = d3.pie()
                .value(d => d.value)
                .sort(null);

            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius * 1);

            const labelArc = d3.arc()
                .innerRadius(radius * 0.6)
                .outerRadius(radius * 0.8);

            const pieG = svg.append("g")
                .attr("transform", `translate(${innerWidth / 2}, ${innerHeight / 2})`);

            const arcs = pieG.selectAll(".arc")
                .data(pie(pieData))
                .enter()
                .append("g")
                .attr("class", "arc");

            arcs.append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => COLORS[i % COLORS.length])
                .attr("stroke", "white")
                .style("stroke-width", "2px")
                .style("opacity", 0.8);

            // Add labels
            arcs.append("text")
                .attr("transform", d => `translate(${labelArc.centroid(d)})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(d => {
                    const percent = (d.endAngle - d.startAngle) / (2 * Math.PI) * 100;
                    return percent > 5 ? `${d.data.name}: ${percent.toFixed(0)}%` : '';
                });

            // Horizontal Legend
            const legend = svg.append("g")
                .attr("transform", `translate(${innerWidth / 2 - radius - 100}, ${innerHeight + 10})`);

            pieData.forEach((d, i) => {
                const legendRow = legend.append("g")
                    .attr("transform", `translate(${i * 105}, 0)`);  // Horizontal alignment, adjusting spacing

                legendRow.append("rect")
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", COLORS[i % COLORS.length]);

                legendRow.append("text")
                    .attr("x", 20)
                    .attr("y", 12)
                    .style("font-size", "12px")
                    .text(`${d.name}: ${d.value}`);
            });
        }
        else {
            // Bar chart with D3
            const data = expensesChartData.filter(d => d.spent > 0 || d.budget > 0);

            // X scale
            const x0 = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, innerWidth])
                .paddingInner(0.1);

            const x1 = d3.scaleBand()
                .domain(['spent', 'budget'])
                .rangeRound([0, x0.bandwidth()])
                .padding(0.05);

            // Y scale
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.spent, d.budget))])
                .nice()
                .range([innerHeight, 0]);

            // Add axes
            svg.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(d3.axisBottom(x0))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");

            svg.append("g")
                .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`));

            // Draw bars
            const groups = svg.selectAll(".group")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "group")
                .attr("transform", d => `translate(${x0(d.name)},0)`);

            // Spent bars
            groups.append("rect")
                .attr("x", d => x1('spent'))
                .attr("y", d => y(d.spent))
                .attr("width", x1.bandwidth())
                .attr("height", d => innerHeight - y(d.spent))
                .attr("fill", "#f87171");

            // Budget bars
            groups.append("rect")
                .attr("x", d => x1('budget'))
                .attr("y", d => y(d.budget))
                .attr("width", x1.bandwidth())
                .attr("height", d => innerHeight - y(d.budget))
                .attr("fill", "#60a5fa");

            // Legend
            const legend = svg.append("g")
                .attr("transform", `translate(${innerWidth - 100}, 0)`);

            const legendData = [
                { name: "Spent", color: "#f87171" },
                { name: "Budget", color: "#60a5fa" }
            ];

            legendData.forEach((d, i) => {
                const legendRow = legend.append("g")
                    .attr("transform", `translate(0, ${i * 20})`);

                legendRow.append("rect")
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", d.color);

                legendRow.append("text")
                    .attr("x", 20)
                    .attr("y", 12)
                    .style("font-size", "12px")
                    .text(d.name);
            });
        }
    }, [chartType, expensesByCategoryData, expensesChartData]);

    // Functions to handle adding new items
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name) return;

        let data = await createCategories(newCategory);
        if (data.id) {
            setCategories([...categories, { ...data }]);
        } else {
            alert('Failed to Add New Category');
        }

        setNewCategory({ name: '', type: 'expense' });
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.categoryId) return;

        // const newId = Math.max(0, ...transactions.map(t => t.id)) + 1;
        let data = await createTransaction(newTransaction);
        if (data.id) {
            setTransactions([
                ...transactions,
                data
            ]);
            setNewTransaction({
                description: '',
                amount: '',
                categoryId: newTransaction.categoryId,
                date: new Date().toISOString().slice(0, 10)
            });
        } else {
            alert('Failed to Add New Transaction');
        }

    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        if (!newBudget.categoryId || !newBudget.amount) return;

        // Check if budget for this category already exists
        const existingBudgetIndex = budgets.find(b => b.categoryId === parseInt(newBudget.categoryId));

        if (existingBudgetIndex.id) {
            // Update existing budget
            let data = await updateBudget(existingBudgetIndex.id, newBudget);
            if (data.id) {
                const updatedBudgets = budgets.map(budget =>
                    budget.id === data.id ? { ...budget, ...data } : budget
                );

                setBudgets(updatedBudgets);
            } else {
                alert('Failed to update the budget');
            }

        } else {
            // Add new budget
            let data = await createBudget({ categoryId: parseInt(newBudget.categoryId), amount: parseFloat(newBudget.amount) })
            if (data.id) {
                setBudgets([
                    ...budgets,
                    data
                ]);
            } else {
                alert('Failed to Create New Budget')
            }
        }

        setNewBudget({ categoryId: '', amount: '' });
    };

    const handleDeleteTransaction = async (id) => {
        let data = await deleteTransaction(id);
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const handleDeleteCategory = async (id) => {

        let data = await deleteCategories(id);

        // Delete category
        setCategories(categories.filter(c => c.id !== id));

        // Delete all transactions with this category
        setTransactions(transactions.filter(t => t.categoryId !== id));

        // Delete any budget for this category
        setBudgets(budgets.filter(b => b.categoryId !== id));
    };

    const handleDeleteBudget = (categoryId) => {
        setBudgets(budgets.filter(b => b.categoryId !== categoryId));
    };

    const getCategoryName = (categoryId) => {
        return categories.find(c => c.id === categoryId)?.name || 'Unknown';
    };

    const getCategoryType = (categoryId) => {
        return categories.find(c => c.id === categoryId)?.type || 'expense';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white">Personal Budget Tracker</h1>
                    <p className="text-blue-100">Take control of your financial life</p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 mt-3 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            Categories
                        </button>
                        <button
                            onClick={() => setActiveTab('budgets')}
                            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${activeTab === 'budgets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
                                }`}
                        >
                            Budgets
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {/* Income Card */}

                            <Cards title={'Total Income'} amount={totalIncome.toFixed(2)} sign={'TrendingUp'} />

                            {/* Expenses Card */}

                            <Cards title={'Total Expenses'} amount={totalExpenses.toFixed(2)} sign={'TrendingDown'} />

                            {/* Balance Card */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-800">Balance</h3>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{balance.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Expense Analysis</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setChartType('pie')}
                                        className={`p-2 rounded-md flex items-center ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <PieChartIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setChartType('bar')}
                                        className={`p-2 rounded-md flex items-center ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <BarChartIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="h-80">
                                <div ref={chartRef} className="w-full h-full"></div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transactions
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 5)
                                            .map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.description}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {getCategoryName(transaction.categoryId)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getCategoryType(transaction.categoryId) === 'income' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {getCategoryType(transaction.categoryId) === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                <button
                                    onClick={() => setActiveTab('transactions')}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    See All Transactions
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.description}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {getCategoryName(transaction.categoryId)}
                                                    </td>
                                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getCategoryType(transaction.categoryId) === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {getCategoryType(transaction.categoryId) === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination controls */}
                                <div className="flex justify-between items-center mt-6">
                                    <button
                                        onClick={() => setPage(prev => prev - 1)}
                                        disabled={page === 1 || prev === null}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {page}
                                    </span>
                                    <button
                                        onClick={() => setPage(prev => prev + 1)}
                                        disabled={next === null}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Transaction</h3>
                                <form onSubmit={handleAddTransaction}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={newTransaction.description}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newTransaction.amount}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={newTransaction.categoryId}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, categoryId: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <optgroup label="Income">
                                                {categories
                                                    .filter(category => category.type === 'income')
                                                    .map(category => (
                                                        <option key={category.id} value={category.id}>{category.name}</option>
                                                    ))}
                                            </optgroup>
                                            <optgroup label="Expenses">
                                                {categories
                                                    .filter(category => category.type === 'expense')
                                                    .map(category => (
                                                        <option key={category.id} value={category.id}>{category.name}</option>
                                                    ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newTransaction.date}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <PlusCircle className="h-5 w-5 mr-2" />
                                        Add Transaction
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">Categories</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-700 mb-3">Income Categories</h4>
                                        <ul className="space-y-2">
                                            {categories
                                                .filter(category => category.type === 'income')
                                                .map(category => (
                                                    <li key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                                                        <span className="text-gray-900">{category.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-medium text-gray-700 mb-3">Expense Categories</h4>
                                        <ul className="space-y-2">
                                            {categories
                                                .filter(category => category.type === 'expense')
                                                .map(category => (
                                                    <li key={category.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                                                        <span className="text-gray-900">{category.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Category</h3>
                                <form onSubmit={handleAddCategory}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                        <input
                                            type="text"
                                            value={newCategory.name}
                                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <div className="flex space-x-4">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    value="income"
                                                    checked={newCategory.type === 'income'}
                                                    onChange={() => setNewCategory({ ...newCategory, type: 'income' })}
                                                    className="form-radio h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-gray-700">Income</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    value="expense"
                                                    checked={newCategory.type === 'expense'}
                                                    onChange={() => setNewCategory({ ...newCategory, type: 'expense' })}
                                                    className="form-radio h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-gray-700">Expense</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <PlusCircle className="h-5 w-5 mr-2" />
                                        Add Category
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Budgets Tab */}
                {activeTab === 'budgets' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">Budget vs. Actual</h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Budget</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {categories
                                                .filter(category => category.type === 'expense')
                                                .map(category => {
                                                    const budget = budgets.find(b => b.categoryId === category.id)?.amount || 0;
                                                    const spent = transactions
                                                        .filter(t => t.categoryId === category.id)
                                                        .reduce((sum, t) => sum + t.amount, 0);
                                                    const remaining = budget - spent;
                                                    const percentSpent = budget > 0 ? (spent / budget) * 100 : 0;

                                                    return (
                                                        <tr key={category.id}>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {category.name}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                ₹{budget.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                ₹{spent.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                <div className="flex items-center">
                                                                    <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                        ₹{Math.abs(remaining).toFixed(2)} {remaining >= 0 ? 'left' : 'over'}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                                    <div
                                                                        className={`h-2 rounded-full ${percentSpent <= 100 ? 'bg-blue-600' : 'bg-red-600'}`}
                                                                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                {budget > 0 && (
                                                                    <button
                                                                        onClick={() => handleDeleteBudget(category.id)}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Set Budget</h3>
                                <form onSubmit={handleAddBudget}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={newBudget.categoryId}
                                            onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories
                                                .filter(category => category.type === 'expense')
                                                .map(category => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newBudget.amount}
                                            onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <PlusCircle className="h-5 w-5 mr-2" />
                                        Set Budget
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white py-6 border-t">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} Personal Budget Tracker</p>
                    <p className="mt-1">Take control of your financial life</p>
                </div>
            </footer>
        </div>
    );
}