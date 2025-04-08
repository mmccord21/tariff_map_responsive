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

function generateGradientColors(count) {
    // Professional, muted color palette
    const baseColors = [
        '#4a6da7', // Muted blue
        '#6e8bc4', // Light blue
        '#8da7d6', // Softer blue
        '#a3bae6', // Very soft blue
        '#5f7a99', // Steel blue
        '#7494b9', // Sky blue
        '#94adc5', // Baby blue
        '#839fb3', // Pewter blue
        '#6d8a98', // Slate blue
        '#94a9b8'  // Calm gray-blue
    ];
    
    // For small counts, use the most distinct colors
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // For larger counts, interpolate between colors
    const result = [];
    for (let i = 0; i < count; i++) {
        const index = (i * baseColors.length / count) | 0;
        result.push(baseColors[index]);
    }
    
    return result;
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
    // Implementation for sector chart with improved data extraction
    const ctx = getChartContext();
    
    // Extract and categorize tariffs into sectors
    const sectors = {};
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (!tariff.target) return;
            
            // Categorize tariffs into sectors based on keywords
            let sector = 'Other';
            
            if (/auto|car|vehicle/i.test(tariff.target)) {
                sector = "Automotive";
            } else if (/steel|aluminum|metal|iron/i.test(tariff.target)) {
                sector = "Metals & Mining";
            } else if (/electronic|tech|computer|semiconductor|chip/i.test(tariff.target)) {
                sector = "Electronics & Technology";
            } else if (/food|agriculture|crop|grain|fruit|vegetable|meat/i.test(tariff.target)) {
                sector = "Agricultural Products";
            } else if (/textile|clothing|apparel|garment|fabric/i.test(tariff.target)) {
                sector = "Textiles & Apparel";
            } else if (/energy|oil|gas|petroleum|coal/i.test(tariff.target)) {
                sector = "Energy";
            } else if (/chemical|pharmaceutical|drug|medicine/i.test(tariff.target)) {
                sector = "Chemicals & Pharmaceuticals";
            }
            
            if (!sectors[sector]) {
                sectors[sector] = {
                    rates: [],
                    count: 0
                };
            }
            
            if (typeof tariff.rate === 'number') {
                sectors[sector].rates.push(tariff.rate * 100);
            }
            sectors[sector].count++;
        });
    });
    
    // Calculate average rates and prepare data for chart
    const sectorData = Object.entries(sectors).map(([name, data]) => {
        const avgRate = data.rates.length > 0 
            ? data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length
            : 0;
        
        return {
            sector: name,
            avgTariff: avgRate,
            count: data.count
        };
    }).filter(item => item.count >= 2); // Only include sectors with at least 2 tariffs
    
    // Sort by average tariff rate
    sectorData.sort((a, b) => b.avgTariff - a.avgTariff);
    
    // Create professional color palette
    const colors = [
        '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4',
        '#bee3f8', '#ebf8ff', '#2c5282', '#2a4365', '#1a365d'
    ];
    
    // Create horizontal bar chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectorData.map(item => item.sector),
            datasets: [{
                label: 'Average Tariff Rate (%)',
                data: sectorData.map(item => item.avgTariff),
                backgroundColor: sectorData.map((_, i) => colors[i % colors.length]),
                borderColor: '#e2e8f0',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Tariff Rates by Industry Sector',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = sectorData[context.dataIndex];
                            return [
                                `Average Tariff: ${item.avgTariff.toFixed(1)}%`,
                                `Number of Tariffs: ${item.count}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Tariff Rate (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Industry Sector'
                    }
                }
            }
        }
    });
    
    // Update insights for sector view with more professional analysis
    document.getElementById('chart-insights').innerHTML = `
        <h3>Sector Analysis</h3>
        <p>This chart shows the average tariff rates across different industry sectors based on categorization of target products.</p>
        <ul>
            <li><strong>Highest tariff sector:</strong> ${sectorData[0].sector} (${sectorData[0].avgTariff.toFixed(1)}%)</li>
            <li><strong>Lowest tariff sector:</strong> ${sectorData[sectorData.length-1].sector} (${sectorData[sectorData.length-1].avgTariff.toFixed(1)}%)</li>
            <li><strong>Average across sectors:</strong> ${(sectorData.reduce((sum, item) => sum + item.avgTariff, 0) / sectorData.length).toFixed(1)}%</li>
        </ul>
        <p class="insight-note">Note: Sectors are determined by analyzing product descriptions in the tariff data. Only sectors with multiple tariffs are displayed.</p>
    `;
}