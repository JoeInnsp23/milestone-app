// Client-side dashboard.js - Processes JSON and renders UI with dark/light mode
let projectsDataJS = [];
let currentTheme = 'light';

// Add all CSS styles to document
function injectStyles() {
    // Remove any existing dashboard styles
    const existingStyle = document.getElementById('dashboard-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-styles';
    styleSheet.textContent = `
        :root {
            /* Light mode colors (default) */
            --bg-gradient-start: #667eea;
            --bg-gradient-end: #764ba2;
            --card-bg: white;
            --card-bg-alpha: white;
            --text-primary: #333;
            --text-secondary: #666;
            --border-color: #e5e7eb;
            --border-light: #f3f4f6;
            --table-hover: #f9fafb;
            --shadow: rgba(0,0,0,0.1);
            --nav-btn-bg: #667eea;
            --nav-btn-hover: #5a67d8;
            --nav-btn-active: #764ba2;
            --link-color: #667eea;
            --link-hover: #764ba2;
            --positive: #10b981;
            --negative: #ef4444;
            --warning: #fb923c;
            --chart-grid: rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] {
            /* Dark mode colors */
            --bg-gradient-start: #1a1a2e;
            --bg-gradient-end: #16213e;
            --card-bg: #1e293b;
            --card-bg-alpha: #1e293b;
            --text-primary: #e8e8e8;
            --text-secondary: #a8a8a8;
            --border-color: #334155;
            --border-light: #1e293b;
            --table-hover: #334155;
            --shadow: rgba(0,0,0,0.5);
            --nav-btn-bg: #334155;
            --nav-btn-hover: #475569;
            --nav-btn-active: #3b82f6;
            --link-color: #60a5fa;
            --link-hover: #93bbfc;
            --positive: #34d399;
            --negative: #f87171;
            --warning: #fbbf24;
            --chart-grid: rgba(255, 255, 255, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            overflow-y: auto;
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%) !important;
            background-attachment: fixed !important;
            min-height: 100vh;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            transition: background 0.3s ease;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
            align-items: initial !important;
            justify-content: initial !important;
        }

        #dashboard-container {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        /* Navigation */
        .nav-bar {
            background: var(--card-bg);
            padding: 15px 20px;
            box-shadow: 0 2px 10px var(--shadow);
            position: sticky;
            top: 0;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .nav-content {
            width: 100%;
            padding: 0 20px;
            margin: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: none;
        }

        @media (min-width: 768px) {
            .nav-content {
                padding: 0 30px;
            }
        }

        @media (min-width: 1200px) {
            .nav-content {
                padding: 0 40px;
            }
        }

        @media (min-width: 1600px) {
            .nav-content {
                padding: 0 60px;
            }
        }

        .nav-title {
            font-size: 24px;
            font-weight: bold;
            color: var(--text-primary);
        }

        .nav-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .nav-btn {
            padding: 8px 16px;
            background: var(--nav-btn-bg);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }

        .nav-btn:hover {
            background: var(--nav-btn-hover);
            transform: translateY(-1px);
        }

        .nav-btn.active {
            background: var(--nav-btn-active);
        }

        .theme-toggle {
            padding: 8px 12px;
            background: var(--nav-btn-bg);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .theme-toggle:hover {
            background: var(--nav-btn-hover);
            transform: rotate(20deg);
        }

        /* Page containers */
        .page {
            display: none;
            animation: fadeIn 0.3s;
        }

        .page.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .container {
            width: 100%;
            margin: 0;
            padding: 20px;
            max-width: none;
        }

        @media (min-width: 768px) {
            .container {
                padding: 20px 30px;
            }
        }

        @media (min-width: 1200px) {
            .container {
                padding: 30px 40px;
            }
        }

        @media (min-width: 1600px) {
            .container {
                padding: 30px 60px;
            }
        }

        /* Dashboard styles */
        .header {
            background: var(--card-bg) !important;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px var(--shadow);
            transition: all 0.3s ease;
            width: 100%;
            opacity: 1 !important;
        }

        h1 {
            color: var(--text-primary);
            margin-bottom: 10px;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 18px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            width: 100%;
        }

        .stat-card {
            background: var(--card-bg) !important;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px var(--shadow);
            transition: transform 0.3s, box-shadow 0.3s;
            width: 100%;
            min-width: 0;
            opacity: 1 !important;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px var(--shadow);
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: var(--text-primary);
        }

        .stat-value.positive {
            color: var(--positive);
        }

        .stat-value.negative {
            color: var(--negative);
        }

        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
            width: 100%;
        }

        @media (max-width: 1100px) {
            .chart-grid {
                grid-template-columns: 1fr;
            }
        }

        .chart-card {
            background: var(--card-bg) !important;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px var(--shadow);
            transition: all 0.3s ease;
            width: 100%;
            min-width: 0;
            opacity: 1 !important;
        }

        .chart-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--text-primary);
        }

        .table-card {
            background: var(--card-bg) !important;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px var(--shadow);
            overflow-x: auto;
            transition: all 0.3s ease;
            width: 100%;
            opacity: 1 !important;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: var(--border-light);
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: var(--text-primary);
            border-bottom: 2px solid var(--border-color);
        }

        td {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary);
        }

        tr:hover {
            background: var(--table-hover);
        }

        .project-link {
            color: var(--link-color);
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s;
        }

        .project-link:hover {
            color: var(--link-hover);
            text-decoration: underline;
        }

        .profit-bar {
            display: inline-block;
            height: 20px;
            border-radius: 10px;
            min-width: 5px;
        }

        .profit-bar.positive {
            background: var(--positive);
        }

        .profit-bar.negative {
            background: var(--negative);
        }

        /* Project detail page styles */
        .back-btn {
            margin-bottom: 20px;
            padding: 10px 20px;
            background: var(--nav-btn-bg);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }

        .back-btn:hover {
            background: var(--nav-btn-hover);
            transform: translateX(-5px);
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            width: 100%;
        }

        @media (max-width: 768px) {
            .detail-grid {
                grid-template-columns: 1fr;
            }
        }

        .detail-card {
            background: var(--card-bg) !important;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px var(--shadow);
            transition: all 0.3s ease;
            width: 100%;
            min-width: 0;
            opacity: 1 !important;
        }

        .detail-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--text-primary);
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 10px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--border-light);
        }

        .detail-label {
            color: var(--text-secondary);
        }

        .detail-value {
            font-weight: bold;
            color: var(--text-primary);
        }

        .detail-value.positive {
            color: var(--positive);
        }

        .detail-value.negative {
            color: var(--negative);
        }

        @media (max-width: 768px) {
            .chart-grid {
                grid-template-columns: 1fr;
            }
            .nav-content {
                flex-direction: column;
                gap: 10px;
            }
        }

        @media print {
            .nav-bar {
                display: none;
            }
            body {
                background: white;
                padding: 0;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Helper function to parse value
function parseValue(value) {
    if (!value || value === "") return 0;
    return parseFloat(value.replace(/,/g, ''));
}

// Helper function to extract project name
function getProjectName(report) {
    return report.ReportTitles[2] || 'Unknown Project';
}

// Helper to create safe ID from project name
function createSafeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

// Process webhook JSON data (matching server-side logic)
function processWebhookData(webhookResponse) {
    const xeroData = webhookResponse.data || webhookResponse;
    const projectsData = [];

    xeroData.forEach((item, index) => {
        const report = item.json?.Reports?.[0] || item.Reports?.[0];
        if (!report) return;

        const projectInfo = {
            id: createSafeId(getProjectName(report)),
            index: index,
            name: getProjectName(report),
            company: report.ReportTitles[1],
            period: report.ReportTitles[3],
            reportDate: report.ReportDate,
            totalIncome: 0,
            totalCostOfSales: 0,
            totalOperatingExpenses: 0,
            grossProfit: 0,
            netProfit: 0,
            details: {
                income: [],
                costOfSales: [],
                operatingExpenses: []
            }
        };

        // Process report rows to get detailed line items
        report.Rows.forEach(row => {
            if (row.RowType === "Section") {
                const sectionTitle = row.Title || "";

                if (row.Rows) {
                    row.Rows.forEach(subRow => {
                        if (subRow.RowType === "Row") {
                            const itemName = subRow.Cells[0].Value;
                            const itemValue = parseValue(subRow.Cells[1].Value);
                            const accountId = subRow.Cells[0].Attributes?.[0]?.Value || '';

                            // Categorize the item
                            if (sectionTitle === "Income" && itemName !== "Gross Profit" && itemName !== "Net Profit") {
                                projectInfo.details.income.push({
                                    name: itemName,
                                    value: itemValue,
                                    accountId: accountId
                                });
                            } else if (sectionTitle === "Less Cost of Sales" && itemName !== "Gross Profit" && itemName !== "Net Profit") {
                                projectInfo.details.costOfSales.push({
                                    name: itemName,
                                    value: itemValue,
                                    accountId: accountId
                                });
                            } else if (sectionTitle === "Less Operating Expenses" && itemName !== "Net Profit") {
                                projectInfo.details.operatingExpenses.push({
                                    name: itemName,
                                    value: itemValue,
                                    accountId: accountId
                                });
                            }

                            // Capture special values
                            if (itemName === "Gross Profit") {
                                projectInfo.grossProfit = itemValue;
                            } else if (itemName === "Net Profit") {
                                projectInfo.netProfit = itemValue;
                            }
                        } else if (subRow.RowType === "SummaryRow") {
                            const totalName = subRow.Cells[0].Value;
                            const totalValue = parseValue(subRow.Cells[1].Value);

                            if (totalName === "Total Income") {
                                projectInfo.totalIncome = totalValue;
                            } else if (totalName === "Total Cost of Sales") {
                                projectInfo.totalCostOfSales = totalValue;
                            } else if (totalName === "Total Operating Expenses") {
                                projectInfo.totalOperatingExpenses = totalValue;
                            }
                        }
                    });
                }
            }
        });

        projectsData.push(projectInfo);
    });

    // Sort by net profit
    projectsData.sort((a, b) => b.netProfit - a.netProfit);

    return projectsData;
}

// Theme toggle functionality
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);

    // Update toggle button icon
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }

    // Force card backgrounds based on theme
    const allCards = document.querySelectorAll('.stat-card, .chart-card, .detail-card, .header, .table-card, .nav-bar');
    allCards.forEach(card => {
        if (currentTheme === 'dark') {
            card.style.backgroundColor = '#1e293b';
            card.style.opacity = '1';
        } else {
            card.style.backgroundColor = 'white';
            card.style.opacity = '1';
        }
    });

    // Update chart colors if charts are initialized
    if (window.chartsInitialized) {
        updateChartThemes();
    }
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Update chart themes
function updateChartThemes() {
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#e8e8e8' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Update all chart instances
    Chart.helpers.each(Chart.instances, (chart) => {
        // Update text colors
        chart.options.plugins.legend.labels.color = textColor;
        chart.options.plugins.title.color = textColor;

        // Update grid colors if scales exist
        if (chart.options.scales) {
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
        }

        chart.update();
    });
}

// Navigation functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Set active button
    const activeBtn = [...document.querySelectorAll('.nav-btn')].find(btn =>
        btn.textContent.toLowerCase().includes(pageId.toLowerCase()) ||
        (pageId === 'overview' && btn.textContent === 'Overview')
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Initialize charts if showing overview
    if (pageId === 'overview' && !window.chartsInitialized) {
        setTimeout(() => {
            initializeMainCharts();
            window.chartsInitialized = true;
        }, 100);
    }
}

function showProjectDetail(projectId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show project detail page
    const projectPage = document.getElementById('project-' + projectId);
    if (projectPage) {
        projectPage.classList.add('active');

        // Initialize project chart if not already done
        if (!window['projectChart_' + projectId]) {
            setTimeout(() => {
                initializeProjectChart(projectId);
            }, 100);
        }
    }
}

// Initialize main dashboard charts
function initializeMainCharts() {
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#e8e8e8' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Calculate data
    const top10Projects = projectsDataJS.slice(0, 10);
    const profitableProjects = projectsDataJS.filter(p => p.netProfit > 0);
    const totalRevenue = projectsDataJS.reduce((sum, p) => sum + p.totalIncome, 0);
    const totalCosts = projectsDataJS.reduce((sum, p) => sum + p.totalCostOfSales, 0);
    const totalExpenses = projectsDataJS.reduce((sum, p) => sum + p.totalOperatingExpenses, 0);

    // Top 10 Projects Chart
    const ctx1 = document.getElementById('profitChart').getContext('2d');
    window.profitChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: top10Projects.map(p => p.name.substring(0, 20) + (p.name.length > 20 ? '...' : '')),
            datasets: [{
                label: 'Net Profit',
                data: top10Projects.map(p => p.netProfit),
                backgroundColor: top10Projects.map(p =>
                    p.netProfit >= 0 ? '#10b981' : '#ef4444'
                )
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    color: textColor
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + value.toLocaleString('en-GB');
                        },
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Revenue Breakdown Chart
    const ctx2 = document.getElementById('revenueChart').getContext('2d');
    window.revenueChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Cost of Sales', 'Operating Expenses', 'Net Profit'],
            datasets: [{
                data: [
                    totalCosts,
                    totalExpenses,
                    totalRevenue - totalCosts - totalExpenses
                ],
                backgroundColor: [
                    '#ef4444',
                    '#fb923c',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });

    // Cost Analysis Chart
    const costBreakdown = {};
    projectsDataJS.forEach(p => {
        p.details.costOfSales.forEach(item => {
            costBreakdown[item.name] = (costBreakdown[item.name] || 0) + item.value;
        });
        p.details.operatingExpenses.forEach(item => {
            costBreakdown[item.name] = (costBreakdown[item.name] || 0) + item.value;
        });
    });

    const topCosts = Object.entries(costBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const ctx3 = document.getElementById('costChart').getContext('2d');
    window.costChart = new Chart(ctx3, {
        type: 'horizontalBar',
        data: {
            labels: topCosts.map(([name]) => name),
            datasets: [{
                label: 'Cost',
                data: topCosts.map(([, value]) => value),
                backgroundColor: '#fb923c'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + value.toLocaleString('en-GB');
                        },
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Distribution Chart
    const profitRanges = {
        'Loss > £10k': projectsDataJS.filter(p => p.netProfit < -10000).length,
        'Loss £0-10k': projectsDataJS.filter(p => p.netProfit >= -10000 && p.netProfit < 0).length,
        'Profit £0-10k': projectsDataJS.filter(p => p.netProfit >= 0 && p.netProfit < 10000).length,
        'Profit £10-50k': projectsDataJS.filter(p => p.netProfit >= 10000 && p.netProfit < 50000).length,
        'Profit > £50k': projectsDataJS.filter(p => p.netProfit >= 50000).length
    };

    const ctx4 = document.getElementById('distributionChart').getContext('2d');
    window.distributionChart = new Chart(ctx4, {
        type: 'pie',
        data: {
            labels: Object.keys(profitRanges),
            datasets: [{
                data: Object.values(profitRanges),
                backgroundColor: [
                    '#ef4444',
                    '#fb923c',
                    '#fbbf36',
                    '#a3e635',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Initialize individual project charts
function initializeProjectChart(projectId) {
    const project = projectsDataJS.find(p => p.id === projectId);
    if (!project) return;

    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#e8e8e8' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const ctx = document.getElementById('project-chart-' + projectId).getContext('2d');
    window['projectChart_' + projectId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Cost of Sales', 'Operating Expenses', 'Net Profit'],
            datasets: [{
                label: 'Amount',
                data: [
                    project.totalIncome,
                    -project.totalCostOfSales,
                    -project.totalOperatingExpenses,
                    project.netProfit
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#fb923c',
                    project.netProfit >= 0 ? '#10b981' : '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + Math.abs(value).toLocaleString('en-GB');
                        },
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': £' + Math.abs(context.parsed.y).toLocaleString('en-GB');
                        }
                    }
                }
            }
        }
    });
}

// Render complete dashboard
function renderDashboard(projectsData) {
    // Always inject styles first
    if (typeof injectStyles === 'function') {
        injectStyles();
    }

    projectsDataJS = projectsData;

    // Calculate totals
    const totalRevenue = projectsData.reduce((sum, p) => sum + p.totalIncome, 0);
    const totalCosts = projectsData.reduce((sum, p) => sum + p.totalCostOfSales, 0);
    const totalExpenses = projectsData.reduce((sum, p) => sum + p.totalOperatingExpenses, 0);
    const totalNetProfit = projectsData.reduce((sum, p) => sum + p.netProfit, 0);
    const profitableProjects = projectsData.filter(p => p.netProfit > 0);

    // Get company and period from first project
    const company = projectsData[0]?.company || 'Company';
    const period = projectsData[0]?.period || 'Period';

    // Generate HTML
    const dashboardHTML = `
        <div class="nav-bar">
            <div class="nav-content">
                <div class="nav-title">P&L Dashboard</div>
                <div class="nav-buttons">
                    <button class="nav-btn active" onclick="showPage('overview')">Overview</button>
                    <button class="nav-btn" onclick="showPage('projects')">All Projects</button>
                    <button class="theme-toggle" onclick="toggleTheme()">${currentTheme === 'light' ? '🌙' : '☀️'}</button>
                </div>
            </div>
        </div>

        <!-- Overview Page -->
        <div id="overview-page" class="page active">
            <div class="container">
                <div class="header">
                    <h1>Projects P&L Dashboard</h1>
                    <div class="subtitle">${company} - ${period}</div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Projects</div>
                        <div class="stat-value">${projectsData.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Revenue</div>
                        <div class="stat-value">£${totalRevenue.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Net Profit</div>
                        <div class="stat-value ${totalNetProfit >= 0 ? 'positive' : 'negative'}">
                            £${totalNetProfit.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Profitable Projects</div>
                        <div class="stat-value">${profitableProjects.length} / ${projectsData.length}</div>
                    </div>
                </div>

                <div class="chart-grid">
                    <div class="chart-card">
                        <div class="chart-title">Top 10 Projects by Net Profit</div>
                        <canvas id="profitChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Revenue Breakdown</div>
                        <canvas id="revenueChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Cost Analysis</div>
                        <canvas id="costChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Project Performance Distribution</div>
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- All Projects List Page -->
        <div id="projects-page" class="page">
            <div class="container">
                <div class="table-card">
                    <div class="chart-title">All Projects Summary (Click project name for details)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Revenue</th>
                                <th>Cost of Sales</th>
                                <th>Operating Exp.</th>
                                <th>Net Profit</th>
                                <th>Margin %</th>
                                <th>Visual</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectsData.map(p => {
                                const margin = p.totalIncome > 0 ? ((p.netProfit / p.totalIncome) * 100).toFixed(1) : 0;
                                const maxProfit = Math.max(...projectsData.map(proj => Math.abs(proj.netProfit)));
                                const barWidth = Math.abs(p.netProfit) / maxProfit * 150;
                                return `
                                <tr>
                                    <td><a class="project-link" onclick="showProjectDetail('${p.id}')">${p.name}</a></td>
                                    <td>£${p.totalIncome.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td>£${p.totalCostOfSales.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td>£${p.totalOperatingExpenses.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td style="color: ${p.netProfit >= 0 ? '#10b981' : '#ef4444'}">
                                        £${p.netProfit.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td>${margin}%</td>
                                    <td>
                                        <span class="profit-bar ${p.netProfit >= 0 ? 'positive' : 'negative'}"
                                              style="width: ${barWidth}px"></span>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Individual Project Detail Pages -->
        ${projectsData.map(project => {
            const grossMargin = project.totalIncome > 0 ? ((project.grossProfit / project.totalIncome) * 100).toFixed(1) : 0;
            const netMargin = project.totalIncome > 0 ? ((project.netProfit / project.totalIncome) * 100).toFixed(1) : 0;

            return `
            <div id="project-${project.id}" class="page">
                <div class="container">
                    <button class="back-btn" onclick="showPage('projects')">← Back to All Projects</button>

                    <div class="header">
                        <h1>${project.name}</h1>
                        <div class="subtitle">${project.company} - ${project.period}</div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Total Income</div>
                            <div class="stat-value">£${project.totalIncome.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Gross Profit</div>
                            <div class="stat-value ${project.grossProfit >= 0 ? 'positive' : 'negative'}">
                                £${project.grossProfit.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                            <div style="margin-top: 5px; color: var(--text-secondary);">Margin: ${grossMargin}%</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Net Profit</div>
                            <div class="stat-value ${project.netProfit >= 0 ? 'positive' : 'negative'}">
                                £${project.netProfit.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                            <div style="margin-top: 5px; color: var(--text-secondary);">Margin: ${netMargin}%</div>
                        </div>
                    </div>

                    <div class="detail-grid">
                        ${project.details.income.length > 0 ? `
                        <div class="detail-card">
                            <div class="detail-title">Income Breakdown</div>
                            ${project.details.income.map(item => `
                            <div class="detail-row">
                                <div class="detail-label">${item.name}</div>
                                <div class="detail-value positive">£${item.value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                            `).join('')}
                            <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid var(--text-primary);">
                                <div class="detail-label">Total Income</div>
                                <div class="detail-value positive">£${project.totalIncome.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${project.details.costOfSales.length > 0 ? `
                        <div class="detail-card">
                            <div class="detail-title">Cost of Sales</div>
                            ${project.details.costOfSales.map(item => `
                            <div class="detail-row">
                                <div class="detail-label">${item.name}</div>
                                <div class="detail-value negative">£${item.value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                            `).join('')}
                            <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid var(--text-primary);">
                                <div class="detail-label">Total Cost of Sales</div>
                                <div class="detail-value negative">£${project.totalCostOfSales.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${project.details.operatingExpenses.length > 0 ? `
                        <div class="detail-card">
                            <div class="detail-title">Operating Expenses</div>
                            ${project.details.operatingExpenses.map(item => `
                            <div class="detail-row">
                                <div class="detail-label">${item.name}</div>
                                <div class="detail-value negative">£${item.value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                            `).join('')}
                            <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid var(--text-primary);">
                                <div class="detail-label">Total Operating Expenses</div>
                                <div class="detail-value negative">£${project.totalOperatingExpenses.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="chart-grid">
                        <div class="chart-card">
                            <div class="chart-title">Revenue vs Costs</div>
                            <canvas id="project-chart-${project.id}"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('')}
    `;

    // Insert dashboard HTML
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = dashboardHTML;

        // Initialize charts after DOM is ready
        setTimeout(() => {
            initializeMainCharts();
            window.chartsInitialized = true;
        }, 100);

        // Force reapply styles after render to combat any overrides
        setTimeout(() => {
            // Force dark mode styles if currently in dark mode
            if (currentTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');

                // Force card backgrounds
                const allCards = document.querySelectorAll('.stat-card, .chart-card, .detail-card, .header, .table-card, .nav-bar');
                allCards.forEach(card => {
                    card.style.backgroundColor = '#1e293b';
                    card.style.opacity = '1';
                });
            }
        }, 200);
    }
}

// Export functions for global access
window.processWebhookData = processWebhookData;
window.renderDashboard = renderDashboard;
window.showPage = showPage;
window.showProjectDetail = showProjectDetail;
window.toggleTheme = toggleTheme;
window.loadThemePreference = loadThemePreference;