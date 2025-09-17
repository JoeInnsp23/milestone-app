// Enhanced HTML dashboard with individual project pages - outputs as binary for n8n
const xeroData = $input.all();

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

// Process all reports with detailed information
const projectsData = [];

xeroData.forEach((item, index) => {
  const report = item.json.Reports[0];
  
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

// Sort and prepare data
projectsData.sort((a, b) => b.netProfit - a.netProfit);

// Prepare chart data
const top10Projects = projectsData.slice(0, 10);
const profitableProjects = projectsData.filter(p => p.netProfit > 0);

// Calculate totals
const totalRevenue = projectsData.reduce((sum, p) => sum + p.totalIncome, 0);
const totalCosts = projectsData.reduce((sum, p) => sum + p.totalCostOfSales, 0);
const totalExpenses = projectsData.reduce((sum, p) => sum + p.totalOperatingExpenses, 0);
const totalNetProfit = projectsData.reduce((sum, p) => sum + p.netProfit, 0);

// Generate HTML Dashboard with navigation
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P&L Dashboard - ${projectsData[0].company}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        /* Navigation */
        .nav-bar {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        .nav-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: #5a67d8;
            transform: translateY(-1px);
        }
        .nav-btn.active {
            background: #764ba2;
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
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Dashboard styles */
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 18px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }
        .stat-value.positive {
            color: #10b981;
        }
        .stat-value.negative {
            color: #ef4444;
        }
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        .chart-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .chart-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
        .table-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e5e7eb;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background: #f9fafb;
        }
        .project-link {
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s;
        }
        .project-link:hover {
            color: #764ba2;
            text-decoration: underline;
        }
        .profit-bar {
            display: inline-block;
            height: 20px;
            border-radius: 10px;
            min-width: 5px;
        }
        .profit-bar.positive {
            background: linear-gradient(90deg, #10b981, #34d399);
        }
        .profit-bar.negative {
            background: linear-gradient(90deg, #ef4444, #f87171);
        }
        
        /* Project detail page styles */
        .back-btn {
            margin-bottom: 20px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }
        .back-btn:hover {
            background: #5a67d8;
            transform: translateX(-5px);
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .detail-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-label {
            color: #666;
        }
        .detail-value {
            font-weight: bold;
            color: #333;
        }
        .detail-value.positive {
            color: #10b981;
        }
        .detail-value.negative {
            color: #ef4444;
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
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <div class="nav-bar">
        <div class="nav-content">
            <div class="nav-title">P&L Dashboard</div>
            <div class="nav-buttons">
                <button class="nav-btn active" onclick="showPage('overview')">Overview</button>
                <button class="nav-btn" onclick="showPage('projects')">All Projects</button>
            </div>
        </div>
    </div>

    <!-- Overview Page -->
    <div id="overview-page" class="page active">
        <div class="container">
            <div class="header">
                <h1>Projects P&L Dashboard</h1>
                <div class="subtitle">${projectsData[0].company} - ${projectsData[0].period}</div>
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
                        <div style="margin-top: 5px; color: #666;">Margin: ${grossMargin}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Net Profit</div>
                        <div class="stat-value ${project.netProfit >= 0 ? 'positive' : 'negative'}">
                            £${project.netProfit.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div style="margin-top: 5px; color: #666;">Margin: ${netMargin}%</div>
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
                        <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid #333;">
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
                        <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid #333;">
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
                        <div class="detail-row" style="font-weight: bold; margin-top: 10px; border-top: 2px solid #333;">
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

    <script>
        // Store projects data for use in navigation
        const projectsDataJS = ${JSON.stringify(projectsData)};
        
        // Navigation functions
        function showPage(pageName) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Update nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected page
            if (pageName === 'overview') {
                document.getElementById('overview-page').classList.add('active');
                document.querySelectorAll('.nav-btn')[0].classList.add('active');
                // Initialize main charts if not already done
                if (!window.chartsInitialized) {
                    initializeMainCharts();
                    window.chartsInitialized = true;
                }
            } else if (pageName === 'projects') {
                document.getElementById('projects-page').classList.add('active');
                document.querySelectorAll('.nav-btn')[1].classList.add('active');
            }
        }
        
        function showProjectDetail(projectId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show project detail page
            document.getElementById('project-' + projectId).classList.add('active');
            
            // Initialize project chart if not already done
            if (!window['projectChart_' + projectId]) {
                initializeProjectChart(projectId);
            }
        }
        
        // Initialize main dashboard charts
        function initializeMainCharts() {
            // Chart 1: Top 10 Projects by Net Profit
            const profitCtx = document.getElementById('profitChart').getContext('2d');
            new Chart(profitCtx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(top10Projects.map(p => p.name.substring(0, 20)))},
                    datasets: [{
                        label: 'Net Profit',
                        data: ${JSON.stringify(top10Projects.map(p => p.netProfit))},
                        backgroundColor: ${JSON.stringify(top10Projects.map(p => 
                            p.netProfit >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                        ))},
                    }]
                },
                options: {
                    responsive: true,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const project = ${JSON.stringify(top10Projects)}[index];
                            showProjectDetail(project.id);
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '£' + value.toLocaleString('en-GB');
                                }
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
                                    return 'Net Profit: £' + context.parsed.y.toLocaleString('en-GB');
                                }
                            }
                        }
                    }
                }
            });

            // Chart 2: Revenue Breakdown Pie Chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            const top5Revenue = [...projectsDataJS]
                .filter(p => p.totalIncome > 0)
                .sort((a, b) => b.totalIncome - a.totalIncome)
                .slice(0, 5);
            const othersRevenue = projectsDataJS
                .filter(p => !top5Revenue.includes(p))
                .reduce((sum, p) => sum + p.totalIncome, 0);
            
            new Chart(revenueCtx, {
                type: 'doughnut',
                data: {
                    labels: [...top5Revenue.map(p => p.name.substring(0, 20)), 'Others'],
                    datasets: [{
                        data: [...top5Revenue.map(p => p.totalIncome), othersRevenue],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.8)',
                            'rgba(118, 75, 162, 0.8)',
                            'rgba(237, 100, 166, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            if (index < top5Revenue.length) {
                                const project = top5Revenue[index];
                                showProjectDetail(project.id);
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });

            // Chart 3: Cost Analysis
            const costCtx = document.getElementById('costChart').getContext('2d');
            new Chart(costCtx, {
                type: 'bar',
                data: {
                    labels: ['Cost of Sales', 'Operating Expenses', 'Net Profit'],
                    datasets: [{
                        label: 'Amount',
                        data: [${totalCosts}, ${totalExpenses}, ${totalNetProfit}],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            ${totalNetProfit >= 0 ? "'rgba(16, 185, 129, 0.8)'" : "'rgba(239, 68, 68, 0.8)'"}
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
                                    return '£' + value.toLocaleString('en-GB');
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Chart 4: Distribution
            const distCtx = document.getElementById('distributionChart').getContext('2d');
            const ranges = [
                { label: '> £100k Profit', count: projectsDataJS.filter(p => p.netProfit > 100000).length },
                { label: '£50k - £100k', count: projectsDataJS.filter(p => p.netProfit >= 50000 && p.netProfit <= 100000).length },
                { label: '£0 - £50k', count: projectsDataJS.filter(p => p.netProfit >= 0 && p.netProfit < 50000).length },
                { label: 'Break Even', count: projectsDataJS.filter(p => p.netProfit === 0).length },
                { label: 'Loss < £50k', count: projectsDataJS.filter(p => p.netProfit < 0 && p.netProfit > -50000).length },
                { label: 'Loss > £50k', count: projectsDataJS.filter(p => p.netProfit <= -50000).length }
            ];
            
            new Chart(distCtx, {
                type: 'pie',
                data: {
                    labels: ranges.map(r => r.label),
                    datasets: [{
                        data: ranges.map(r => r.count),
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.9)',
                            'rgba(52, 211, 153, 0.8)',
                            'rgba(167, 243, 208, 0.8)',
                            'rgba(156, 163, 175, 0.8)',
                            'rgba(252, 165, 165, 0.8)',
                            'rgba(239, 68, 68, 0.9)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
        
        // Initialize individual project charts
        function initializeProjectChart(projectId) {
            const project = projectsDataJS.find(p => p.id === projectId);
            if (!project) return;
            
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
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            project.netProfit >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
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
                                }
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
        
        // Initialize main charts on load
        window.addEventListener('load', () => {
            initializeMainCharts();
            window.chartsInitialized = true;
        });
    </script>
</body>
</html>
`;

// Convert HTML to Buffer
const htmlBuffer = Buffer.from(htmlContent, 'utf8');

// Return HTML as plain text (NOT binary)
return {
  json: {
    html: htmlContent,  // The complete HTML string
    stats: {
      totalProjects: projectsData.length,
      totalRevenue: totalRevenue,
      totalNetProfit: totalNetProfit,
      profitableProjects: profitableProjects.length,
      generated: new Date().toISOString()
    }
  }
};