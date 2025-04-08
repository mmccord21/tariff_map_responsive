document.addEventListener('DOMContentLoaded', function() {
    // Setup tab for charts view
    setupChartsTab();
    
    // Load chart libraries when the charts tab is activated
    document.querySelector('[data-tab="charts-view"]').addEventListener('click', function() {
        if (!window.chartsInitialized) {
            initializeCharts();
            window.chartsInitialized = true;
        }
    });
});

// Update the charts view HTML structure for more analytics options
function setupChartsTab() {
    // Add chart tab to navigation
    const tabsContainer = document.querySelector('.tabs');
    const chartTab = document.createElement('div');
    chartTab.className = 'tab';
    chartTab.setAttribute('data-tab', 'charts-view');
    chartTab.textContent = 'Analytics';
    tabsContainer.appendChild(chartTab);
    
    // Create charts view container with enhanced options
    const container = document.querySelector('.container');
    const chartsView = document.createElement('div');
    chartsView.id = 'charts-view';
    chartsView.className = 'tab-content';
    
    chartsView.innerHTML = `
        <div class="filters-row">
            <select id="chart-type" class="analytics-select">
                <option value="top10">Top/Bottom Countries</option>
                <option value="regional">Regional Analysis</option>
                <option value="sector">Sector Analysis</option>
                <option value="timeline">Tariff Timeline</option>
                <option value="authority">Legal Authority</option>
                <option value="comparison">Country Comparison</option>
            </select>
            
            <div class="filter-options">
                <select id="filter-region" class="analytics-select">
                    <option value="all">All Regions</option>
                    <option value="asia">Asia</option>
                    <option value="europe">Europe</option>
                    <option value="africa">Africa</option>
                    <option value="north-america">North America</option>
                    <option value="south-america">South America</option>
                    <option value="oceania">Oceania</option>
                </select>
                
                <select id="filter-count" class="analytics-select">
                    <option value="10">Show 10</option>
                    <option value="20">Show 20</option>
                    <option value="all">Show All</option>
                </select>
                
                <select id="filter-sort" class="analytics-select">
                    <option value="high-low">Highest First</option>
                    <option value="low-high">Lowest First</option>
                    <option value="alpha">Alphabetical</option>
                </select>
            </div>
            
            <button id="download-chart" class="action-button">
                <i class="fas fa-download"></i> Export Chart
            </button>
        </div>
        
        <div class="comparison-controls" style="display: none;">
            <div class="country-selector">
                <label>Select Countries to Compare:</label>
                <div class="country-checkboxes"></div>
            </div>
        </div>
        
        <div id="chart-container"></div>
        
        <div class="stats-row">
            <div class="stat-box">
                <div class="stat-title">Global Average</div>
                <div id="global-avg" class="stat-value">--</div>
            </div>
            <div class="stat-box">
                <div class="stat-title">Highest Tariff</div>
                <div id="highest-rate" class="stat-value">--</div>
            </div>
            <div class="stat-box">
                <div class="stat-title">Lowest Tariff</div>
                <div id="lowest-rate" class="stat-value">--</div>
            </div>
            <div class="stat-box">
                <div class="stat-title">Median Rate</div>
                <div id="median-rate" class="stat-value">--</div>
            </div>
        </div>
        
        <div id="chart-insights" class="insights-panel">
            <h3>Key Insights</h3>
            <p>Select a chart type above to see analysis.</p>
        </div>
    `;
    
    // Insert charts view before the footer
    const footer = document.querySelector('footer');
    container.insertBefore(chartsView, footer);
}

// Store full data to allow filtering
window.fullTariffData = null;

function initializeCharts() {
    // Load Chart.js library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
    script.onload = function() {
        fetch('data/tariff_data.json')
            .then(response => response.json())
            .then(data => {
                // Store full data globally
                window.fullTariffData = data;
                
                // Initialize filters
                setupFilters();
                
                // Create initial chart
                createInitialChart();
                
                // Show global stats
                updateGlobalStats(data);
            });
    };
    document.head.appendChild(script);
}

function setupFilters() {
    // Set up chart type selector
    document.getElementById('chart-type').addEventListener('change', function(e) {
        const chartType = e.target.value;
        
        // Show/hide comparison controls based on selection
        const comparisonControls = document.querySelector('.comparison-controls');
        comparisonControls.style.display = chartType === 'comparison' ? 'block' : 'none';
        
        // Create appropriate chart
        createFilteredChart(chartType);
    });
    
    // Set up region filter
    document.getElementById('filter-region').addEventListener('change', function() {
        createFilteredChart(document.getElementById('chart-type').value);
    });
    
    // Set up count filter
    document.getElementById('filter-count').addEventListener('change', function() {
        createFilteredChart(document.getElementById('chart-type').value);
    });
    
    // Set up sort filter
    document.getElementById('filter-sort').addEventListener('change', function() {
        createFilteredChart(document.getElementById('chart-type').value);
    });
}

function createFilteredChart(chartType) {
    // Apply filters to data
    const filteredData = applyFilters(window.fullTariffData);
    
    // Create appropriate chart
    switch(chartType) {
        case 'top10':
            createTop10Chart(processCountryTariffAverages(filteredData));
            break;
        case 'regional':
            createRegionalChart(filteredData);
            break;
        case 'sector':
            createSectorChart(filteredData);
            break;
        case 'timeline':
            createTimelineChart(filteredData);
            break;
        case 'authority':
            createLegalAuthorityChart(filteredData);
            break;
        case 'comparison':
            setupCountryComparison(filteredData);
            break;
    }
}

function applyFilters(data) {
    const regionFilter = document.getElementById('filter-region').value;
    
    if (regionFilter === 'all') {
        return data;
    }
    
    // Define region mappings
    const regionMappings = {
        'asia': ['China', 'Japan', 'South Korea', 'India', 'Vietnam', 'Thailand', 'Taiwan', 'Malaysia', 'Indonesia', 'Philippines', 'Laos', 'Cambodia', 'Myanmar (Burma)', 'Brunei', 'Bangladesh', 'Pakistan', 'Sri Lanka'],
        'europe': ['European Union', 'United Kingdom', 'Switzerland', 'Norway', 'Serbia', 'Bosnia and Herzegovina', 'North Macedonia', 'Moldova', 'Liechtenstein'],
        'africa': ['Algeria', 'Angola', 'Botswana', 'Cameroon', 'Chad', 'Democratic Republic of the Congo', 'Côte d`Ivoire', 'Equatorial Guinea', 'Lesotho', 'Libya', 'Madagascar', 'Malawi', 'Mauritius', 'Mozambique', 'Namibia', 'Nigeria', 'South Africa', 'Tunisia', 'Zambia', 'Zimbabwe'],
        'north-america': ['Canada', 'Mexico', 'Nicaragua'],
        'south-america': ['Argentina', 'Brazil', 'Guyana', 'Venezuela'],
        'oceania': ['Australia', 'Fiji', 'Nauru', 'Vanuatu']
    };
    
    // Filter countries by region
    const filteredData = {};
    const countries = regionMappings[regionFilter] || [];
    
    countries.forEach(country => {
        if (data[country]) {
            filteredData[country] = data[country];
        }
    });
    
    return filteredData;
}

function updateGlobalStats(data) {
    // Calculate global average tariff
    let allRates = [];
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (typeof tariff.rate === 'number') {
                allRates.push(tariff.rate * 100);
            }
        });
    });
    
    // Sort rates for calculations
    allRates.sort((a, b) => a - b);
    
    const globalAvg = allRates.length > 0 ? 
        allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length : 0;
    
    const highest = allRates.length > 0 ? allRates[allRates.length - 1] : 0;
    const lowest = allRates.length > 0 ? allRates[0] : 0;
    
    // Calculate median
    let median;
    if (allRates.length > 0) {
        const mid = Math.floor(allRates.length / 2);
        median = allRates.length % 2 === 0 ? 
            (allRates[mid - 1] + allRates[mid]) / 2 : 
            allRates[mid];
    } else {
        median = 0;
    }
    
    // Update stats display
    document.getElementById('global-avg').textContent = globalAvg.toFixed(2) + '%';
    document.getElementById('highest-rate').textContent = highest.toFixed(2) + '%';
    document.getElementById('lowest-rate').textContent = lowest.toFixed(2) + '%';
    document.getElementById('median-rate').textContent = median.toFixed(2) + '%';
}

function createInitialChart() {
    // Create top 10 tariff countries chart by default
    const filteredData = applyFilters(window.fullTariffData);
    const countryData = processCountryTariffAverages(filteredData);
    createTop10Chart(countryData);
}

function processCountryTariffAverages(data) {
    // Calculate average tariff for each country
    const countryAverages = [];
    Object.entries(data).forEach(([country, tariffs]) => {
        const rates = tariffs
            .map(t => typeof t.rate === 'number' ? t.rate : 0)
            .filter(rate => rate > 0);
        
        if (rates.length > 0) {
            const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            countryAverages.push({
                country: country,
                avgTariff: avg * 100 // Convert to percentage
            });
        }
    });
    
    // Sort by tariff rate descending
    return countryAverages.sort((a, b) => b.avgTariff - a.avgTariff);
}

function createTop10Chart(countryData) {
    const top10 = countryData.slice(0, 10);
    
    const ctx = getChartContext();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(item => item.country),
            datasets: [{
                label: 'Average Tariff Rate (%)',
                data: top10.map(item => item.avgTariff),
                backgroundColor: generateGradientColors(top10.length),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Countries by Average Tariff Rate',
                    font: { size: 16, weight: 'bold', family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
                    color: '#2c5282' // Match your primary color
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2c5282',
                    bodyColor: '#4a5568',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Tariff Rate: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e2e8f0' // Lighter grid lines
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Tariff Rate (%)',
                        color: '#2c5282',
                        font: {
                            weight: 'normal',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    }
                },
                x: {
                    grid: {
                        display: false // Remove vertical grid lines
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    }
                }
            }
        }
    });
    
    // Update insights panel
    updateInsightsPanel(top10);
}

function getChartContext() {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '<canvas id="tariff-chart"></canvas>';
    
    return document.getElementById('tariff-chart').getContext('2d');
}

function generateGradientColors(count, secondary = false) {
    const baseColors = secondary ? 
        [
            'rgba(94, 129, 172, 0.8)',
            'rgba(136, 143, 175, 0.8)',
            'rgba(163, 158, 177, 0.8)',
            'rgba(193, 173, 180, 0.8)',
            'rgba(225, 191, 184, 0.8)',
            'rgba(251, 212, 191, 0.8)'
        ] : 
        [
            'rgba(76, 114, 176, 0.8)',
            'rgba(85, 130, 169, 0.8)',
            'rgba(95, 145, 161, 0.8)',
            'rgba(106, 159, 152, 0.8)',
            'rgba(119, 170, 142, 0.8)',
            'rgba(134, 180, 131, 0.8)'
        ];
    
    return baseColors.slice(0, count);
}

function updateInsightsPanel(data) {
    const insightsPanel = document.getElementById('chart-insights');
    const highest = data[0];
    const lowest = data[data.length - 1];
    const average = data.reduce((sum, item) => sum + item.avgTariff, 0) / data.length;
    
    insightsPanel.innerHTML = `
        <h3>Key Insights</h3>
        <ul>
            <li><strong>${highest.country}</strong> has the highest average tariff at <strong>${highest.avgTariff.toFixed(2)}%</strong></li>
            <li><strong>${lowest.country}</strong> has the lowest average tariff in this group at <strong>${lowest.avgTariff.toFixed(2)}%</strong></li>
            <li>The average tariff across these countries is <strong>${average.toFixed(2)}%</strong></li>
            <li>Regional analysis shows [INSERT ANALYSIS BASED ON REGIONS]</li>
        </ul>
        <p class="insight-note">Note: Averages are calculated based on available tariff data.</p>
    `;
}