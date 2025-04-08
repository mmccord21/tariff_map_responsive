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

// Set up chart download functionality
document.getElementById('download-chart').addEventListener('click', function() {
    const canvas = document.getElementById('tariff-chart');
    if (!canvas) return;
    
    // Get current chart type for filename
    const chartType = document.getElementById('chart-type').value;
    const chartTypes = {
        'top10': 'Top_Countries',
        'regional': 'Regional_Analysis',
        'sector': 'Sector_Analysis',
        'timeline': 'Tariff_Timeline',
        'authority': 'Legal_Authority',
        'comparison': 'Country_Comparison'
    };
    
    const filename = `USA_Tariff_${chartTypes[chartType] || 'Chart'}_${new Date().toISOString().split('T')[0]}.png`;
    
    // Convert canvas to downloadable image
    try {
        // For most browsers
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error('Error exporting chart:', e);
        alert('Unable to download chart. Your browser may not support this feature.');
    }
});
// Helper function to get appropriate chart configuration based on device
function getChartResponsiveOptions(isMobile) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: isMobile ? 5 : 10,
                right: isMobile ? 10 : 20,
                bottom: isMobile ? 5 : 10,
                left: isMobile ? 10 : 20
            }
        },
        plugins: {
            title: {
                display: true,
                font: { 
                    size: isMobile ? 14 : 16, 
                    weight: 'bold',
                    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                padding: {
                    top: isMobile ? 5 : 10,
                    bottom: isMobile ? 10 : 20
                }
            },
            legend: {
                labels: {
                    boxWidth: isMobile ? 12 : 20,
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            },
            tooltip: {
                titleFont: {
                    size: isMobile ? 12 : 14
                },
                bodyFont: {
                    size: isMobile ? 11 : 12
                },
                boxPadding: isMobile ? 4 : 6
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: isMobile ? 45 : 0,
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            },
            y: {
                ticks: {
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        },
        elements: {
            point: {
                radius: isMobile ? 2 : 3
            },
            line: {
                borderWidth: isMobile ? 1.5 : 2
            }
        }
    };
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

function createRegionalChart(data) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = getChartContext();
    
    // Define regions and their member countries
    const regionMap = {
        'Asia': ['China', 'Japan', 'South Korea', 'India', 'Vietnam', 'Thailand', 'Taiwan', 
                'Malaysia', 'Indonesia', 'Philippines', 'Laos', 'Cambodia', 'Myanmar (Burma)', 
                'Brunei', 'Bangladesh', 'Pakistan', 'Sri Lanka'],
        'Europe': ['European Union', 'United Kingdom', 'Switzerland', 'Norway', 'Serbia', 
                  'Bosnia and Herzegovina', 'North Macedonia', 'Moldova', 'Liechtenstein'],
        'Africa': ['Algeria', 'Angola', 'Botswana', 'Cameroon', 'Chad', 'Democratic Republic of the Congo', 
                  'Côte d`Ivoire', 'Equatorial Guinea', 'Lesotho', 'Libya', 'Madagascar', 'Malawi', 
                  'Mauritius', 'Mozambique', 'Namibia', 'Nigeria', 'South Africa', 'Tunisia', 
                  'Zambia', 'Zimbabwe'],
        'North America': ['Canada', 'Mexico', 'Nicaragua'],
        'South America': ['Argentina', 'Brazil', 'Guyana', 'Venezuela'],
        'Oceania': ['Australia', 'Fiji', 'Nauru', 'Vanuatu'],
        'Middle East': ['Iraq', 'Israel', 'Jordan', 'Saudi Arabia', 'Syria']
    };
    
    // Calculate regional statistics
    const regionStats = {};
    const allCountryCounts = {}; // For tracking total countries per region
    
    // Initialize region statistics
    Object.keys(regionMap).forEach(region => {
        regionStats[region] = {
            totalRate: 0,
            countryCount: 0,
            tariffCount: 0,
            countries: [],
            highestRate: 0,
            highestCountry: '',
            lowestRate: Infinity,
            lowestCountry: ''
        };
        allCountryCounts[region] = regionMap[region].length;
    });
    
    // Process each country's tariffs
    Object.entries(data).forEach(([country, tariffs]) => {
        // Find which region this country belongs to
        let countryRegion = 'Other';
        for (const [region, countries] of Object.entries(regionMap)) {
            if (countries.includes(country)) {
                countryRegion = region;
                break;
            }
        }
        
        // Initialize region if not already done
        if (!regionStats[countryRegion]) {
            regionStats[countryRegion] = {
                totalRate: 0,
                countryCount: 0,
                tariffCount: 0,
                countries: [],
                highestRate: 0,
                highestCountry: '',
                lowestRate: Infinity,
                lowestCountry: ''
            };
            allCountryCounts[countryRegion] = 0;
        }
        
        // Calculate country's average tariff
        const rates = tariffs.map(t => typeof t.rate === 'number' ? t.rate : 0)
                             .filter(rate => rate > 0);
        if (rates.length > 0) {
            const countryAvg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            const countryAvgPercent = countryAvg * 100;
            
            // Update region statistics
            regionStats[countryRegion].totalRate += countryAvgPercent;
            regionStats[countryRegion].countryCount++;
            regionStats[countryRegion].tariffCount += rates.length;
            regionStats[countryRegion].countries.push(country);
            
            // Track highest and lowest country rates
            if (countryAvgPercent > regionStats[countryRegion].highestRate) {
                regionStats[countryRegion].highestRate = countryAvgPercent;
                regionStats[countryRegion].highestCountry = country;
            }
            if (countryAvgPercent < regionStats[countryRegion].lowestRate) {
                regionStats[countryRegion].lowestRate = countryAvgPercent;
                regionStats[countryRegion].lowestCountry = country;
            }
        }
    });
    
    // Calculate averages and prepare chart data
    const regionData = [];
    
    Object.entries(regionStats).forEach(([region, stats]) => {
        if (stats.countryCount > 0) {
            const avgRate = stats.totalRate / stats.countryCount;
            const coverage = (stats.countryCount / (allCountryCounts[region] || 1)) * 100;
            
            regionData.push({
                region: region,
                avgRate: avgRate,
                tariffCount: stats.tariffCount,
                countryCount: stats.countryCount,
                totalCountries: allCountryCounts[region] || stats.countryCount,
                coverage: coverage,
                highestRate: stats.highestRate,
                highestCountry: stats.highestCountry,
                lowestRate: stats.lowestRate !== Infinity ? stats.lowestRate : 0,
                lowestCountry: stats.lowestCountry || 'N/A'
            });
        }
    });
    
    // Sort by average tariff rate
    regionData.sort((a, b) => b.avgRate - a.avgRate);
    
    // Choose appropriate chart type based on device
    const chartType = isMobile ? 'bar' : 'bar';
    const chartColors = generateGradientColors(regionData.length);
    
    // Create chart configuration
    const chartConfig = {
        type: chartType,
        data: {
            labels: regionData.map(item => item.region),
            datasets: [{
                label: 'Average Tariff Rate (%)',
                data: regionData.map(item => item.avgRate),
                backgroundColor: chartColors,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: isMobile ? 'y' : 'x', // Horizontal bars on mobile
            plugins: {
                title: {
                    display: true,
                    text: 'Tariff Rates by Region',
                    font: { 
                        size: isMobile ? 14 : 16, 
                        weight: 'bold',
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    },
                    color: '#2c5282'
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
                    padding: isMobile ? 10 : 12,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const item = regionData[context.dataIndex];
                            return [
                                `Average Tariff: ${item.avgRate.toFixed(2)}%`,
                                `Countries: ${item.countryCount} of ${item.totalCountries} (${item.coverage.toFixed(0)}%)`,
                                `Total Tariffs: ${item.tariffCount}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e2e8f0'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: isMobile ? 10 : 12,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    },
                    title: {
                        display: !isMobile,
                        text: isMobile ? '' : 'Region',
                        color: '#2c5282',
                        font: {
                            weight: 'normal',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                            size: 12
                        }
                    }
                },
                x: {
                    beginAtZero: true,
                    grid: {
                        display: !isMobile
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: isMobile ? 10 : 12,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Tariff Rate (%)',
                        color: '#2c5282',
                        font: {
                            weight: 'normal',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    }
                }
            }
        }
    };
    
    // Create the chart
    new Chart(ctx, chartConfig);
    
    // Generate insights panel
    updateRegionalInsightsPanel(regionData);
}

function updateRegionalInsightsPanel(regionData) {
    const insightsPanel = document.getElementById('chart-insights');
    
    // Find highest and lowest regions
    const highestRegion = regionData[0];
    const lowestRegion = regionData[regionData.length - 1];
    
    // Calculate global average across regions
    const globalAvg = regionData.reduce((sum, region) => sum + region.avgRate, 0) / regionData.length;
    
    // Calculate total countries and tariffs
    const totalCountries = regionData.reduce((sum, region) => sum + region.countryCount, 0);
    const totalTariffs = regionData.reduce((sum, region) => sum + region.tariffCount, 0);
    
    // Find region with most/least country coverage
    const bestCoverage = regionData.reduce((prev, current) => 
        (prev.coverage > current.coverage) ? prev : current);
    const worstCoverage = regionData.reduce((prev, current) => 
        (prev.coverage < current.coverage) ? prev : current);
    
    insightsPanel.innerHTML = `
        <h3>Regional Analysis Insights</h3>
        <ul>
            <li><strong>${highestRegion.region}</strong> has the highest average tariff rate at <strong>${highestRegion.avgRate.toFixed(2)}%</strong></li>
            <li><strong>${lowestRegion.region}</strong> has the lowest average tariff rate at <strong>${lowestRegion.avgRate.toFixed(2)}%</strong></li>
            <li>The highest individual country rate is <strong>${highestRegion.highestCountry}</strong> at <strong>${highestRegion.highestRate.toFixed(2)}%</strong></li>
            <li>The average tariff across all regions is <strong>${globalAvg.toFixed(2)}%</strong></li>
            <li>Data covers <strong>${totalCountries}</strong> countries with <strong>${totalTariffs}</strong> total tariff measures</li>
        </ul>
        <p class="insight-note">Note: Regional averages are based on available country data, which may not include all countries in each region.</p>
    `;
}

function createSectorChart(data) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = getChartContext();
    
    // Extract and categorize tariffs into sectors
    const sectors = {};
    
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (!tariff.target) return;
            
            // Categorize tariffs into sectors based on keywords
            let sector = 'General';
            const target = tariff.target.toLowerCase();
            
            if (/auto|car|vehicle/i.test(target)) {
                sector = "Automotive";
            } else if (/steel|aluminum|metal|iron/i.test(target)) {
                sector = "Metals & Mining";
            } else if (/electronic|tech|computer|semiconductor|chip/i.test(target)) {
                sector = "Electronics & Technology";
            } else if (/food|agriculture|crop|grain|fruit|vegetable|meat/i.test(target)) {
                sector = "Agricultural Products";
            } else if (/textile|clothing|apparel|garment|fabric/i.test(target)) {
                sector = "Textiles & Apparel";
            } else if (/energy|oil|gas|petroleum|coal/i.test(target)) {
                sector = "Energy";
            } else if (/chemical|pharmaceutical|drug|medicine/i.test(target)) {
                sector = "Chemicals & Pharmaceuticals";
            } else if (/non.*reciprocal|trade/i.test(target)) {
                sector = "General Trade";
            } else if (/digital|service|tax/i.test(target)) {
                sector = "Digital Services";
            } else if (/lumber|timber|wood/i.test(target)) {
                sector = "Forestry & Wood Products";
            } else if (/copper|mineral/i.test(target)) {
                sector = "Minerals & Resources";
            }
            
            // Initialize sector data structure if needed
            if (!sectors[sector]) {
                sectors[sector] = {
                    rates: [],
                    count: 0,
                    countries: new Set(),
                    targets: new Set()
                };
            }
            
            // Add tariff data to appropriate sector
            if (typeof tariff.rate === 'number') {
                sectors[sector].rates.push(tariff.rate * 100);
            }
            sectors[sector].count++;
            sectors[sector].countries.add(country);
            sectors[sector].targets.add(tariff.target);
        });
    });
    
    // Process sector data for chart
    let sectorData = Object.entries(sectors).map(([name, data]) => {
        const avgRate = data.rates.length > 0 
            ? data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length
            : 0;
        
        return {
            sector: name,
            avgTariff: avgRate,
            count: data.count,
            countriesCount: data.countries.size,
            countries: Array.from(data.countries).sort(),
            targetsCount: data.targets.size,
            targets: Array.from(data.targets).slice(0, 5) // Limit to top 5 targets for display
        };
    }).filter(item => item.count >= 1); // Only include sectors with at least one tariff
    
    // Sort by average tariff rate
    sectorData.sort((a, b) => b.avgTariff - a.avgTariff);
    
    // For mobile, limit to most important sectors
    if (isMobile && sectorData.length > 6) {
        sectorData = sectorData.slice(0, 6);
    }
    
    // Create color palette with muted, professional colors
    const chartColors = [
        'rgba(74, 109, 167, 0.8)',
        'rgba(85, 130, 169, 0.8)',
        'rgba(95, 145, 161, 0.8)',
        'rgba(106, 159, 152, 0.8)',
        'rgba(119, 170, 142, 0.8)',
        'rgba(134, 180, 131, 0.8)',
        'rgba(148, 186, 127, 0.8)',
        'rgba(130, 172, 143, 0.8)',
        'rgba(115, 157, 156, 0.8)',
        'rgba(100, 142, 166, 0.8)'
    ];
    
    // Create horizontal bar chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectorData.map(item => item.sector),
            datasets: [{
                label: 'Average Tariff Rate (%)',
                data: sectorData.map(item => item.avgTariff),
                backgroundColor: sectorData.map((_, i) => chartColors[i % chartColors.length]),
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
                    text: isMobile ? 'Tariffs by Industry' : 'Average Tariff Rates by Industry Sector',
                    font: { 
                        size: isMobile ? 14 : 16, 
                        weight: 'bold',
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
                    },
                    color: '#2c5282'
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
                    padding: isMobile ? 8 : 12,
                    callbacks: {
                        label: function(context) {
                            const item = sectorData[context.dataIndex];
                            return [
                                `Average Tariff: ${item.avgTariff.toFixed(2)}%`,
                                `Number of Tariffs: ${item.count}`,
                                `Affects ${item.countriesCount} countries`,
                                item.targetsCount > 1 ? 
                                    `${item.targetsCount} different product categories` : 
                                    `Product: ${item.targets[0]}`
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
                        text: 'Average Tariff Rate (%)',
                        color: '#2c5282',
                        font: {
                            weight: 'normal', 
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                            size: isMobile ? 10 : 12
                        }
                    },
                    grid: {
                        color: '#e2e8f0'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: isMobile ? 10 : 12,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y: {
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: isMobile ? 10 : 12,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }
                    }
                }
            }
        }
    });
    
    // Update insights for sector view with more professional analysis
    updateSectorInsights(sectorData);
}

function updateSectorInsights(sectorData) {
    const insightsPanel = document.getElementById('chart-insights');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    // Find key insights
    const highestSector = sectorData[0];
    const lowestSector = sectorData[sectorData.length - 1];
    const averageTariff = sectorData.reduce((sum, item) => sum + item.avgTariff, 0) / sectorData.length;
    
    // Find most widely affected sector (by country count)
    const mostCountries = sectorData.reduce((prev, current) => 
        (prev.countriesCount > current.countriesCount) ? prev : current);
    
    // Find sector with most different product targets
    const mostProducts = sectorData.reduce((prev, current) => 
        (prev.targetsCount > current.targetsCount) ? prev : current);
    
    // Generate insights
    insightsPanel.innerHTML = `
        <h3>Sector Analysis</h3>
        <ul>
            <li><strong>Highest tariff sector:</strong> ${highestSector.sector} (${highestSector.avgTariff.toFixed(2)}%)</li>
            <li><strong>Lowest tariff sector:</strong> ${lowestSector.sector} (${lowestSector.avgTariff.toFixed(2)}%)</li>
            <li><strong>Average across sectors:</strong> ${averageTariff.toFixed(2)}%</li>
            <li><strong>Most widespread:</strong> ${mostCountries.sector} affects ${mostCountries.countriesCount} countries</li>
            <li><strong>Most diverse:</strong> ${mostProducts.sector} covers ${mostProducts.targetsCount} product categories</li>
        </ul>
        <p class="insight-note">Note: Sectors are determined by analyzing product descriptions in the tariff data. ${isMobile ? '' : 'Tariffs are categorized based on keywords in target fields.'}</p>
    `;
}

function createTimelineChart(data) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = getChartContext();
    
    // Extract the timeline data
    const timelineData = [];
    const today = new Date();
    
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (tariff.date_in_effect && tariff.date_in_effect !== 'TBD' && 
                tariff.date_in_effect !== 'Exempt' && tariff.date_in_effect !== 'Under investigation') {
                try {
                    const effectiveDate = new Date(tariff.date_in_effect);
                    if (!isNaN(effectiveDate) && effectiveDate <= today) {
                        const rate = typeof tariff.rate === 'number' ? tariff.rate * 100 : 0;
                        timelineData.push({
                            country: country,
                            target: tariff.target,
                            date: effectiveDate,
                            rate: rate
                        });
                    }
                } catch(e) {
                    console.warn(`Invalid date for ${country}: ${tariff.date_in_effect}`);
                }
            }
        });
    });
    
    // Sort by date
    timelineData.sort((a, b) => a.date - b.date);
    
    // Group by month for clearer visualization
    const months = {};
    const labels = [];
    const rateData = [];
    const countData = [];
    
    timelineData.forEach(item => {
        const monthYear = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!months[monthYear]) {
            months[monthYear] = {
                totalRate: 0,
                count: 0,
                label: item.date.toLocaleString('default', { month: 'short', year: 'numeric' })
            };
        }
        months[monthYear].totalRate += item.rate;
        months[monthYear].count++;
    });
    
    // Convert to arrays for Chart.js
    Object.entries(months).forEach(([key, value]) => {
        labels.push(value.label);
        rateData.push((value.totalRate / value.count).toFixed(1));
        countData.push(value.count);
    });
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avg Tariff Rate (%)',
                    data: rateData,
                    borderColor: '#4a6da7',
                    backgroundColor: 'rgba(74, 109, 167, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Tariffs',
                    data: countData,
                    borderColor: '#6d8a98',
                    backgroundColor: 'rgba(109, 138, 152, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Tariff Implementation Timeline',
                    font: { 
                        size: isMobile ? 14 : 16, 
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2c5282',
                    bodyColor: '#4a5568',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    usePointStyle: true,
                    callbacks: {
                        title: function(items) {
                            return items[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: isMobile ? 45 : 0,
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Average Tariff Rate (%)',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    grid: {
                        color: '#e2e8f0'
                    },
                    ticks: {
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Tariffs',
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                }
            }
        }
    });
    
    // Update insights
    updateTimelineInsights(timelineData);
}

function updateTimelineInsights(data) {
    const insightsPanel = document.getElementById('chart-insights');
    
    // Find peak implementation periods
    const monthCounts = {};
    data.forEach(item => {
        const monthYear = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthCounts[monthYear]) {
            monthCounts[monthYear] = {
                count: 0,
                label: item.date.toLocaleString('default', { month: 'long', year: 'numeric' })
            };
        }
        monthCounts[monthYear].count++;
    });
    
    // Sort by count to find peak months
    const sortedMonths = Object.values(monthCounts).sort((a, b) => b.count - a.count);
    const peakMonth = sortedMonths[0];
    
    // Find the average implementation delay
    let totalDelay = 0;
    let delayCount = 0;
    
    Object.entries(window.fullTariffData).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (tariff.date_announced && tariff.date_in_effect && 
                tariff.date_in_effect !== 'TBD' && tariff.date_in_effect !== 'Exempt' &&
                tariff.date_in_effect !== 'Under investigation') {
                try {
                    const announcedDate = new Date(tariff.date_announced);
                    const effectiveDate = new Date(tariff.date_in_effect);
                    if (!isNaN(announcedDate) && !isNaN(effectiveDate)) {
                        const delay = Math.round((effectiveDate - announcedDate) / (1000 * 60 * 60 * 24)); // days
                        totalDelay += delay;
                        delayCount++;
                    }
                } catch(e) {
                    // Skip invalid dates
                }
            }
        });
    });
    
    const avgDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;
    
    // Oldest and newest tariffs
    data.sort((a, b) => a.date - b.date);
    const oldest = data[0];
    const newest = data[data.length - 1];
    
    insightsPanel.innerHTML = `
        <h3>Timeline Insights</h3>
        <ul>
            <li><strong>Peak implementation period:</strong> ${peakMonth.label} with ${peakMonth.count} tariffs</li>
            <li><strong>Average implementation delay:</strong> ${avgDelay} days from announcement to effect</li>
            <li><strong>First tariff implemented:</strong> ${oldest.country} on ${oldest.date.toLocaleDateString()} (${oldest.target})</li>
            <li><strong>Most recent tariff:</strong> ${newest.country} on ${newest.date.toLocaleDateString()} (${newest.target})</li>
            <li><strong>Total implementations:</strong> ${data.length} tariffs across ${Object.keys(monthCounts).length} months</li>
        </ul>
        <p class="insight-note">Note: Only includes tariffs with valid implementation dates that have already occurred.</p>
    `;
    
    // Update global stats
    updateGlobalStats(window.fullTariffData);
}

function createLegalAuthorityChart(data) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = getChartContext();
    
    // Extract and categorize by legal authority
    const authorities = {};
    
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            if (!tariff.legal_authority) return;
            
            // Clean up authority name
            let authority = tariff.legal_authority.trim();
            
            if (!authorities[authority]) {
                authorities[authority] = {
                    rates: [],
                    count: 0,
                    countries: new Set()
                };
            }
            
            if (typeof tariff.rate === 'number') {
                authorities[authority].rates.push(tariff.rate * 100);
            }
            authorities[authority].count++;
            authorities[authority].countries.add(country);
        });
    });
    
    // Calculate average rates and prepare data for chart
    const authorityData = Object.entries(authorities).map(([name, data]) => {
        const avgRate = data.rates.length > 0 
            ? data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length
            : 0;
        
        return {
            authority: name,
            avgTariff: avgRate,
            count: data.count,
            countriesCount: data.countries.size
        };
    });
    
    // Sort by count
    authorityData.sort((a, b) => b.count - a.count);
    
    // Create color palette
    const colors = generateGradientColors(authorityData.length);
    
    // Create chart
    new Chart(ctx, {
        type: isMobile ? 'bar' : 'bubble',
        data: {
            labels: authorityData.map(item => item.authority),
            datasets: isMobile ? 
                [{
                    label: 'Number of Tariffs',
                    data: authorityData.map(item => item.count),
                    backgroundColor: colors,
                    borderColor: '#e2e8f0',
                    borderWidth: 1
                }] : 
                [{
                    label: 'Legal Authority Analysis',
                    data: authorityData.map(item => ({
                        x: item.avgTariff,
                        y: item.count,
                        r: Math.min(Math.max(item.countriesCount * 2, 5), 25),
                        authority: item.authority,
                        countries: item.countriesCount
                    })),
                    backgroundColor: colors.map(color => color.replace(')', ', 0.7)')),
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Tariffs by Legal Authority',
                    font: { 
                        size: isMobile ? 14 : 16, 
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return isMobile ? 
                                context[0].label : 
                                context[0].raw.authority;
                        },
                        label: function(context) {
                            if (isMobile) {
                                return `Tariffs: ${context.raw}`;
                            } else {
                                return [
                                    `Avg Tariff Rate: ${context.raw.x.toFixed(1)}%`,
                                    `Number of Tariffs: ${context.raw.y}`,
                                    `Countries Affected: ${context.raw.countries}`
                                ];
                            }
                        }
                    }
                }
            },
            scales: isMobile ? 
                {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Tariffs',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    }
                } :
                {
                    x: {
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Tariffs'
                        }
                    }
                }
        }
    });
    
    // Update insights
    document.getElementById('chart-insights').innerHTML = `
        <h3>Legal Authority Insights</h3>
        <ul>
            <li><strong>Most common authority:</strong> ${authorityData[0].authority} (${authorityData[0].count} tariffs)</li>
            <li><strong>Most widespread impact:</strong> ${authorityData.sort((a, b) => b.countriesCount - a.countriesCount)[0].authority} (${authorityData[0].countriesCount} countries)</li>
            <li><strong>Highest average rate:</strong> ${authorityData.sort((a, b) => b.avgTariff - a.avgTariff)[0].authority} (${authorityData[0].avgTariff.toFixed(1)}%)</li>
            <li><strong>Total legal authorities used:</strong> ${authorityData.length}</li>
        </ul>
        <p class="insight-note">Note: Bubble size represents the number of countries affected by each legal authority. Larger bubbles indicate wider geographic impact.</p>
    `;
}

function setupCountryComparison(data) {
    const comparisonControls = document.querySelector('.comparison-controls');
    const countryCheckboxes = document.querySelector('.country-checkboxes');
    comparisonControls.style.display = 'block';
    
    // Clear existing checkboxes
    countryCheckboxes.innerHTML = '';
    
    // Create checkboxes for all countries with data
    const countries = Object.keys(data).sort();
    
    // Create search input for countries
    const searchDiv = document.createElement('div');
    searchDiv.className = 'country-search';
    searchDiv.innerHTML = `
        <input type="text" id="country-search" placeholder="Search countries...">
        <div class="country-search-results"></div>
    `;
    countryCheckboxes.appendChild(searchDiv);
    
    // Add default selected countries
    const defaultCountries = ['China', 'European Union', 'Canada', 'Mexico'];
    const selectedCountries = new Set(defaultCountries);
    
    // Create checkbox container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'selected-countries';
    countryCheckboxes.appendChild(checkboxContainer);
    
    // Set up search functionality
    const searchInput = document.getElementById('country-search');
    const searchResults = document.querySelector('.country-search-results');
    
    searchInput.addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();
        
        if (searchValue.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        const matchingCountries = countries.filter(country => 
            country.toLowerCase().includes(searchValue) && !selectedCountries.has(country)
        ).slice(0, 10);
        
        searchResults.innerHTML = '';
        if (matchingCountries.length > 0) {
            matchingCountries.forEach(country => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.textContent = country;
                resultItem.addEventListener('click', () => {
                    selectedCountries.add(country);
                    updateSelectedCountries();
                    searchInput.value = '';
                    searchResults.innerHTML = '';
                    createComparisonChart(data, Array.from(selectedCountries));
                });
                searchResults.appendChild(resultItem);
            });
        } else {
            searchResults.innerHTML = '<div class="no-results">No matches found</div>';
        }
    });
    
    function updateSelectedCountries() {
        checkboxContainer.innerHTML = '';
        Array.from(selectedCountries).sort().forEach(country => {
            const countryTag = document.createElement('div');
            countryTag.className = 'country-tag';
            countryTag.innerHTML = `
                ${country}
                <span class="remove-country" data-country="${country}">×</span>
            `;
            checkboxContainer.appendChild(countryTag);
        });
        
        // Add click handlers for removal
        document.querySelectorAll('.remove-country').forEach(btn => {
            btn.addEventListener('click', function() {
                const country = this.getAttribute('data-country');
                selectedCountries.delete(country);
                updateSelectedCountries();
                createComparisonChart(data, Array.from(selectedCountries));
            });
        });
    }
    
    // Initial render
    updateSelectedCountries();
    createComparisonChart(data, Array.from(selectedCountries));
}

function createComparisonChart(data, countries) {
    if (countries.length === 0) {
        document.getElementById('chart-container').innerHTML = '<div class="no-data-message">Please select at least one country to compare</div>';
        return;
    }
    
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = getChartContext();
    
    // Process data for selected countries
    const comparisonData = [];
    
    countries.forEach(country => {
        if (data[country]) {
            const tariffs = data[country];
            const rates = tariffs.map(t => typeof t.rate === 'number' ? t.rate : 0).filter(rate => rate > 0);
            const avgRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
            
            // Categorize tariffs
            const categories = { 'All Tariffs': rates.length };
            
            tariffs.forEach(tariff => {
                if (tariff.target_type) {
                    if (!categories[tariff.target_type]) {
                        categories[tariff.target_type] = 0;
                    }
                    categories[tariff.target_type]++;
                }
            });
            
            comparisonData.push({
                country,
                avgRate: avgRate * 100,
                tariffCount: rates.length,
                categories
            });
        }
    });
    
    // Sort by average tariff rate
    comparisonData.sort((a, b) => b.avgRate - a.avgRate);
    
    // Create chart based on number of countries
    if (comparisonData.length <= 2 || isMobile) {
        // Use bar chart for 1-2 countries or on mobile
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: comparisonData.map(item => item.country),
                datasets: [
                    {
                        label: 'Average Tariff Rate (%)',
                        data: comparisonData.map(item => item.avgRate),
                        backgroundColor: generateGradientColors(comparisonData.length),
                        borderColor: '#e2e8f0',
                        borderWidth: 1
                    },
                    {
                        label: 'Number of Tariffs',
                        data: comparisonData.map(item => item.tariffCount),
                        backgroundColor: generateGradientColors(comparisonData.length, true),
                        borderColor: '#e2e8f0',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: isMobile ? 'y' : 'x',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Country Tariff Comparison',
                        font: { 
                            size: isMobile ? 14 : 16, 
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: !isMobile,
                            text: 'Value',
                            font: {
                                size: isMobile ? 10 : 12
                            }
                        },
                        ticks: {
                            font: {
                                size: isMobile ? 10 : 12
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Use radar chart for 3+ countries on desktop
        const categories = new Set();
        comparisonData.forEach(country => {
            Object.keys(country.categories).forEach(cat => categories.add(cat));
        });
        
        const radarData = {
            labels: Array.from(categories),
            datasets: comparisonData.map((country, index) => {
                const color = generateGradientColors(comparisonData.length)[index];
                return {
                    label: country.country,
                    data: Array.from(categories).map(cat => country.categories[cat] || 0),
                    backgroundColor: color.replace(')', ', 0.2)'),
                    borderColor: color,
                    borderWidth: 2,
                    pointBackgroundColor: color
                };
            })
        };
        
        new Chart(ctx, {
            type: 'radar',
            data: radarData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Country Tariff Type Comparison',
                        font: { 
                            size: 16, 
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: '#e2e8f0'
                        },
                        grid: {
                            color: '#e2e8f0'
                        },
                        pointLabels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update insights
    updateComparisonInsights(comparisonData);
}

function updateComparisonInsights(data) {
    const insightsPanel = document.getElementById('chart-insights');
    
    // Find highest and lowest average tariffs
    const highest = data.reduce((prev, current) => (prev.avgRate > current.avgRate) ? prev : current);
    const lowest = data.reduce((prev, current) => (prev.avgRate < current.avgRate) ? prev : current);
    
    // Calculate percentage difference
    const diff = highest.avgRate - lowest.avgRate;
    const percentDiff = lowest.avgRate > 0 ? ((diff / lowest.avgRate) * 100).toFixed(1) : 'N/A';
    
    // Find country with most tariffs
    const mostTariffs = data.reduce((prev, current) => (prev.tariffCount > current.tariffCount) ? prev : current);
    
    insightsPanel.innerHTML = `
        <h3>Comparison Insights</h3>
        <ul>
            <li><strong>Highest average tariff:</strong> ${highest.country} (${highest.avgRate.toFixed(1)}%)</li>
            <li><strong>Lowest average tariff:</strong> ${lowest.country} (${lowest.avgRate.toFixed(1)}%)</li>
            <li><strong>Tariff difference:</strong> ${diff.toFixed(1)} percentage points (${percentDiff}%)</li>
            <li><strong>Most tariff measures:</strong> ${mostTariffs.country} with ${mostTariffs.tariffCount} tariffs</li>
        </ul>
        <p>Across these ${data.length} countries, the average tariff rate is ${(data.reduce((sum, item) => sum + item.avgRate, 0) / data.length).toFixed(1)}%.</p>
        <p class="insight-note">Note: Analysis based on tariffs with numerical rates only.</p>
    `;
}