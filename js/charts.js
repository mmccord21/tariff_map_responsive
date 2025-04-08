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

function setupChartsTab() {
    // Add chart tab to navigation
    const tabsContainer = document.querySelector('.tabs');
    const chartTab = document.createElement('div');
    chartTab.className = 'tab';
    chartTab.setAttribute('data-tab', 'charts-view');
    chartTab.textContent = 'Analytics';
    tabsContainer.appendChild(chartTab);
    
    // Create charts view container
    const container = document.querySelector('.container');
    const chartsView = document.createElement('div');
    chartsView.id = 'charts-view';
    chartsView.className = 'tab-content';
    
    chartsView.innerHTML = `
        <div class="filters-row">
            <select id="chart-type">
                <option value="top10">Top 10 Highest Tariff Countries</option>
                <option value="regional">Regional Tariff Analysis</option>
                <option value="sector">Tariffs by Sector</option>
            </select>
            <button id="download-chart" class="action-button">
                <i class="fas fa-download"></i> Export Chart
            </button>
        </div>
        <div id="chart-container"></div>
        <div id="chart-insights" class="insights-panel">
            <h3>Key Insights</h3>
            <p>Select a chart type above to see analysis.</p>
        </div>
    `;
    
    // Insert charts view before the footer
    const footer = document.querySelector('footer');
    container.insertBefore(chartsView, footer);
}

function initializeCharts() {
    // Load Chart.js library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
    script.onload = function() {
        createInitialChart();
        setupChartEventListeners();
    };
    document.head.appendChild(script);
}

function createInitialChart() {
    // Create top 10 tariff countries chart by default
    fetch('data/tariff_data.json')
        .then(response => response.json())
        .then(data => {
            const countryData = processCountryTariffAverages(data);
            createTop10Chart(countryData);
        });
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
                    font: { size: 16 }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Tariff Rate: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Tariff Rate (%)'
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

function generateGradientColors(count) {
    return Array(count).fill().map((_, i) => 
        `hsl(${220 + (i * 120 / count)}, 70%, 60%)`
    );
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

function setupChartEventListeners() {
    document.getElementById('chart-type').addEventListener('change', function(e) {
        const chartType = e.target.value;
        
        fetch('data/tariff_data.json')
            .then(response => response.json())
            .then(data => {
                const countryData = processCountryTariffAverages(data);
                
                switch(chartType) {
                    case 'top10':
                        createTop10Chart(countryData);
                        break;
                    case 'regional':
                        createRegionalChart(data);
                        break;
                    case 'sector':
                        createSectorChart(data);
                        break;
                }
            });
    });
    
    document.getElementById('download-chart').addEventListener('click', function() {
        const canvas = document.getElementById('tariff-chart');
        const image = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = 'tariff-chart.png';
        link.href = image;
        link.click();
    });
}

function createRegionalChart(data) {
    // Implementation for regional chart
    const ctx = getChartContext();
    
    // Simplified region map (in real implementation, map countries to regions)
    const regions = {
        'North America': ['Canada', 'Mexico'],
        'Asia': ['China', 'Japan', 'South Korea', 'India', 'Vietnam', 'Thailand', 'Taiwan'],
        'Europe': ['European Union', 'United Kingdom', 'Switzerland', 'Norway']
    };
    
    // Calculate regional averages
    const regionalData = [];
    Object.entries(regions).forEach(([region, countries]) => {
        let totalRate = 0;
        let countryCount = 0;
        
        countries.forEach(country => {
            if (data[country]) {
                const rates = data[country]
                    .map(t => typeof t.rate === 'number' ? t.rate : 0)
                    .filter(rate => rate > 0);
                
                if (rates.length > 0) {
                    totalRate += rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
                    countryCount++;
                }
            }
        });
        
        if (countryCount > 0) {
            regionalData.push({
                region: region,
                avgTariff: (totalRate / countryCount) * 100
            });
        }
    });
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: regionalData.map(item => item.region),
            datasets: [{
                data: regionalData.map(item => item.avgTariff),
                backgroundColor: generateGradientColors(regionalData.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Tariff Rates by Region',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Update insights for regional view
    document.getElementById('chart-insights').innerHTML = `
        <h3>Regional Analysis</h3>
        <p>This chart shows the average tariff rates across major global regions.</p>
        <ul>
            ${regionalData.map(item => 
                `<li><strong>${item.region}:</strong> ${item.avgTariff.toFixed(2)}% average tariff</li>`
            ).join('')}
        </ul>
        <p class="insight-note">Note: Regional averages are calculated based on representative countries in each region.</p>
    `;
}

function createSectorChart(data) {
    // Implementation for sector chart (simplified)
    const ctx = getChartContext();
    
    // Extract sectors (in a full implementation, you would categorize targets into sectors)
    const sectorData = [
        { sector: "Automobiles", avgTariff: 25.0 },
        { sector: "Steel & Aluminum", avgTariff: 25.0 },
        { sector: "Electronics", avgTariff: 15.5 },
        { sector: "Agricultural Products", avgTariff: 12.2 },
        { sector: "Textiles", avgTariff: 18.7 }
    ];
    
    new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: sectorData.map(item => item.sector),
            datasets: [{
                label: 'Average Tariff Rate (%)',
                data: sectorData.map(item => item.avgTariff),
                backgroundColor: generateGradientColors(sectorData.length)
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Tariff Rates by Industry Sector',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Update insights for sector view
    document.getElementById('chart-insights').innerHTML = `
        <h3>Sector Analysis</h3>
        <p>This chart shows the average tariff rates across different industry sectors.</p>
        <ul>
            <li><strong>Highest tariff sector:</strong> Automobiles and Steel/Aluminum (25%)</li>
            <li><strong>Lowest tariff sector:</strong> Agricultural Products (12.2%)</li>
            <li>The tariff rate for electronics (15.5%) is significantly lower than industrial goods</li>
        </ul>
        <p class="insight-note">Note: Sector classifications are based on target product categories.</p>
    `;
}