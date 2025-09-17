// Client-side dashboard.js - Processes JSON and renders UI with dark/light mode
let projectsDataJS = [];
let currentTheme = 'light';

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
    const textColor = isDark ? '#e8e8e8' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';

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
    const textColor = isDark ? '#e8e8e8' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';

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
                ],
                borderWidth: 0  // Remove white borders in dark mode
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
        type: 'bar',
        data: {
            labels: topCosts.map(([name]) => name),
            datasets: [{
                label: 'Cost',
                data: topCosts.map(([, value]) => value),
                backgroundColor: '#fb923c'
            }]
        },
        options: {
            indexAxis: 'y',  // This makes it horizontal
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
                ],
                borderWidth: 0  // Remove white borders in dark mode
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
    const textColor = isDark ? '#e8e8e8' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';

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
    // Add class to body to apply dashboard styles
    document.body.classList.add('dashboard-loaded');

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
    }
}

// Export functions for global access
window.processWebhookData = processWebhookData;
window.renderDashboard = renderDashboard;
window.showPage = showPage;
window.showProjectDetail = showProjectDetail;
window.toggleTheme = toggleTheme;
window.loadThemePreference = loadThemePreference;

// Add theme change observer to ensure all elements update
function setupThemeObserver() {
    // Listen for theme changes and update all relevant elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                const theme = document.documentElement.getAttribute('data-theme');
                // Add a class to trigger CSS transitions
                document.body.classList.add('theme-changing');
                setTimeout(() => {
                    document.body.classList.remove('theme-changing');
                }, 300);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// Initialize theme observer
setupThemeObserver();