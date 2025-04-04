document.addEventListener('DOMContentLoaded', function() {
    // Load the tariff data and world map
    Promise.all([
        d3.json('data/tariff_data.json'),
        d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
    ]).then(([tariffData, worldData]) => {
        createMap(tariffData, worldData);
        createDataTable(tariffData);
        setupTabNavigation();
    }).catch(error => {
        console.error('Error loading data:', error);
    });
});

// Tab navigation functionality
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Resize map if map tab is activated (to handle responsive layout changes)
            if (tabId === 'map-view') {
                window.dispatchEvent(new Event('resize'));
            }
        });
    });
}

// Create and populate the data table
function createDataTable(tariffData) {
    const tableBody = document.getElementById('tariff-table-body');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    // Flatten the tariff data for table display
    let flattenedData = [];
    Object.entries(tariffData).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            flattenedData.push({
                country: country,
                target: tariff.target,
                rate: tariff.rate,
                date_announced: tariff.date_announced,
                date_in_effect: tariff.date_in_effect,
                legal_authority: tariff.legal_authority,
                sources: tariff.sources
            });
        });
    });
    
    // Initial render of the table
    renderTable(flattenedData);
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredData = flattenedData.filter(item => 
            item.country.toLowerCase().includes(searchTerm) || 
            (item.target && item.target.toLowerCase().includes(searchTerm))
        );
        renderTable(filteredData);
    });
    
    // Sort functionality
    sortSelect.addEventListener('change', () => {
        const sortValue = sortSelect.value;
        let sortedData = [...flattenedData];
        
        switch(sortValue) {
            case 'country-asc':
                sortedData.sort((a, b) => a.country.localeCompare(b.country));
                break;
            case 'country-desc':
                sortedData.sort((a, b) => b.country.localeCompare(a.country));
                break;
            case 'rate-asc':
                sortedData.sort((a, b) => {
                    const rateA = typeof a.rate === 'number' ? a.rate : -1;
                    const rateB = typeof b.rate === 'number' ? b.rate : -1;
                    return rateA - rateB;
                });
                break;
            case 'rate-desc':
                sortedData.sort((a, b) => {
                    const rateA = typeof a.rate === 'number' ? a.rate : -1;
                    const rateB = typeof b.rate === 'number' ? b.rate : -1;
                    return rateB - rateA;
                });
                break;
        }
        
        // Apply current search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            sortedData = sortedData.filter(item => 
                item.country.toLowerCase().includes(searchTerm) || 
                (item.target && item.target.toLowerCase().includes(searchTerm))
            );
        }
        
        renderTable(sortedData);
    });
    
    // Function to render the table with the provided data
    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No matching tariff data found';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Country cell
            const countryCell = document.createElement('td');
            countryCell.textContent = item.country;
            row.appendChild(countryCell);
            
            // Target cell
            const targetCell = document.createElement('td');
            targetCell.textContent = item.target || 'N/A';
            row.appendChild(targetCell);
            
            // Rate cell
            const rateCell = document.createElement('td');
            rateCell.className = 'rate-cell';
            if (typeof item.rate === 'number') {
                rateCell.textContent = (item.rate * 100).toFixed(1) + '%';
            } else {
                rateCell.textContent = item.rate || 'N/A';
            }
            row.appendChild(rateCell);
            
            // Date announced cell
            const dateAnnouncedCell = document.createElement('td');
            dateAnnouncedCell.textContent = item.date_announced || 'N/A';
            row.appendChild(dateAnnouncedCell);
            
            // Date in effect cell
            const dateInEffectCell = document.createElement('td');
            dateInEffectCell.textContent = item.date_in_effect || 'N/A';
            row.appendChild(dateInEffectCell);
            
            // Legal authority cell
            const legalAuthorityCell = document.createElement('td');
            legalAuthorityCell.textContent = item.legal_authority || 'N/A';
            row.appendChild(legalAuthorityCell);
            
            // Sources cell
            const sourcesCell = document.createElement('td');
            sourcesCell.textContent = item.sources || 'N/A';
            row.appendChild(sourcesCell);
            
            tableBody.appendChild(row);
        });
    }
}

function createMap(tariffData, worldData) {
    // Get the min and max tariff percentages directly from the data
    let tariffPercentages = [];
    Object.entries(tariffData).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            const rate = tariff.rate;
            let percentage = 0;
            if (typeof rate === 'string') {
                const match = rate.match(/(\d+(?:\.\d+)?)%/);
                if (match) percentage = parseFloat(match[1]);
            } else if (typeof rate === 'number') {
                percentage = rate * 100;
            }
            tariffPercentages.push(percentage);
        });
    });
    
    // Handle window resize for responsive map
    window.addEventListener('resize', () => {
        d3.select('#map svg').remove();  // Remove existing SVG
        createMap(tariffData, worldData); // Recreate with new size
    });
    
    const countryNameToISO = {
        'Algeria': 'DZA',
        'Angola': 'AGO',
        'Argentina': 'ARG',
        'Australia': 'AUS',
        'Bangladesh': 'BGD',
        'Bosnia and Herzegovina': 'BIH',
        'Botswana': 'BWA',
        'Brazil': 'BRA',
        'Brunei': 'BRN',
        'Cambodia': 'KHM',
        'Cameroon': 'CMR',
        'Canada': 'CAN',
        'Chad': 'TCD',
        'China': 'CHN',
        'Côte d`Ivoire': 'CIV',
        'Democratic Republic of the Congo': 'COD',
        'Equatorial Guinea': 'GNQ',
        'European Union': 'EUR', // Special case, will need custom handling
        'Falkland Islands': 'FLK',
        'Fiji': 'FJI',
        'Guyana': 'GUY',
        'India': 'IND',
        'Indonesia': 'IDN',
        'Iraq': 'IRQ',
        'Israel': 'ISR',
        'Japan': 'JPN',
        'Jordan': 'JOR',
        'Kazakhstan': 'KAZ',
        'Laos': 'LAO',
        'Lesotho': 'LSO',
        'Libya': 'LBY',
        'Liechtenstein': 'LIE',
        'Madagascar': 'MDG',
        'Malawi': 'MWI',
        'Malaysia': 'MYS',
        'Mauritius': 'MUS',
        'Mexico': 'MEX',
        'Moldova': 'MDA',
        'Mozambique': 'MOZ',
        'Myanmar (Burma)': 'MMR',
        'Namibia': 'NAM',
        'Nauru': 'NRU',
        'Nicaragua': 'NIC',
        'Nigeria': 'NGA',
        'North Macedonia': 'MKD',
        'Norway': 'NOR',
        'Pakistan': 'PAK',
        'Philippines': 'PHL',
        'Russia': 'RUS',
        'Saudi Arabia': 'SAU',
        'Serbia': 'SRB',
        'South Africa': 'ZAF',
        'South Korea': 'KOR',
        'Sri Lanka': 'LKA',
        'Switzerland': 'CHE',
        'Syria': 'SYR',
        'Taiwan': 'TWN',
        'Thailand': 'THA',
        'Tunisia': 'TUN',
        'Turkey': 'TUR',
        'United Kingdom': 'GBR',
        'Vanuatu': 'VUT',
        'Venezuela': 'VEN',
        'Vietnam': 'VNM',
        'Zambia': 'ZMB',
        'Zimbabwe': 'ZWE'
    };
    
    const isoToCountryName = {};
    Object.entries(countryNameToISO).forEach(([name, iso]) => {
        isoToCountryName[iso] = name;
    });

    // Calculate the min and max tariff percentages from the data
    const minTariff = Math.min(...tariffPercentages);
    const maxTariff = Math.max(...tariffPercentages);

    // Create a continuous color scale from green (low tariffs) to yellow (mid tariffs) to red (high tariffs)
    const colorScale = d3.scaleLinear()
        .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5]) // 0% to 50% tariff
        .range(['#63cc2e', '#98cd3d', '#f1e20f', '#f3b712', '#e68722', '#d34a00', '#e74c3c']) // Smooth transition from green to red
        .clamp(true);

    // Set up dimensions
    const width = document.getElementById('map-container').clientWidth;
    const height = document.getElementById('map-container').clientHeight;

    // Create SVG element
    const svg = d3.select('#map')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Create a projection
    const projection = d3.geoNaturalEarth1()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 2]);

    // Create a path generator
    const path = d3.geoPath()
        .projection(projection);

    // Convert TopoJSON to GeoJSON
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    // Calculate average tariff percentage for each country
    const countryTariffPercentages = {};
    Object.entries(tariffData).forEach(([country, tariffs]) => {
        const percentages = tariffs.map(tariff => {
            const rate = tariff.rate;
            if (typeof rate === 'string') {
                const match = rate.match(/(\d+(?:\.\d+)?)%/);
                return match ? parseFloat(match[1]) : 0;
            } else if (typeof rate === 'number') {
                return rate * 100;
            }
            return 0;
        });

        const avgPercentage = percentages.length > 0 
            ? percentages.reduce((sum, val) => sum + val, 0) / percentages.length 
            : 0;

        countryTariffPercentages[country] = avgPercentage;
    });

    // Add countries to the map
    svg.selectAll('.country')
        .data(countries)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('data-iso', d => d.id)
        .style('fill', d => {
            const countryName = d.properties.name;
            if (countryName && countryTariffPercentages[countryName] !== undefined) {
                return colorScale(countryTariffPercentages[countryName]/100);  // Use the color scale
            }
            return '#d0d0d0'; // Default color for countries without tariff data
        })
        .on('mouseover', function(event, d) {
            const iso = d.id;
            const countryName = d.properties.name;

            if (countryName && tariffData[countryName]) {
                showTooltip(event, countryName, tariffData[countryName], countryTariffPercentages[countryName]);
            } else {
                hideTooltip();
            }
        })
        .on('mouseout', hideTooltip)
        .on('touchstart', function(event, d) {
            // For touch devices, show tooltip on touch
            event.preventDefault();
            const countryName = d.properties.name;
            if (countryName && tariffData[countryName]) {
                showTooltip(event, countryName, tariffData[countryName], countryTariffPercentages[countryName]);
            }
        });

    // Add a color legend
    const legendWidth = Math.min(300, width * 0.8);
    const legendHeight = 20;
    const legendX = (width - legendWidth) / 2;
    const legendY = height - 40;

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'tariff-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(0));
    
    gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', colorScale(0.25));
    
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(0.5));
    
    // Add legend rectangle
    svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#tariff-gradient)')
        .style('stroke', '#ccc')
        .style('stroke-width', '1px');
    
    // Add legend title
    svg.append('text')
        .attr('x', legendX + legendWidth / 2)
        .attr('y', legendY - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Tariff Rate (%)');
    
    // Add legend labels
    svg.append('text')
        .attr('x', legendX)
        .attr('y', legendY + legendHeight + 15)
        .attr('text-anchor', 'start')
        .style('font-size', '10px')
        .text('0%');
    
    svg.append('text')
        .attr('x', legendX + legendWidth / 2)
        .attr('y', legendY + legendHeight + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('25%');
    
    svg.append('text')
        .attr('x', legendX + legendWidth)
        .attr('y', legendY + legendHeight + 15)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .text('50%');
    
    // Tooltip functions
    function showTooltip(event, countryName, tariffs, avgTariff) {
        const tooltip = document.getElementById('tooltip');
    
        // Create tooltip content
        tooltip.innerHTML = `
            <h3>${countryName}</h3>
            <div id="tariff-info">
                ${tariffs.map(t => `
                    <div class="tariff-item">
                        <div><span class="tariff-rate">${typeof t.rate === 'number' ? (t.rate * 100).toFixed(1) + '%' : t.rate}</span> - ${t.target || 'Unknown Product'}</div>
                        <div class="tariff-date">Announcement Date: ${t.date_announced || 'No date'}</div>
                        <div class="tariff-date">Effective Date: ${t.date_in_effect || 'No date'}</div>
                    </div>
                `).join('')}
                <div><strong>Average Tariff:</strong> ${avgTariff.toFixed(2)}%</div>
            </div>
        `;
    
        // Show the tooltip temporarily to measure its size
        tooltip.style.display = 'block';
    
        const tooltipRect = tooltip.getBoundingClientRect();
        const mapRect = document.getElementById('map-container').getBoundingClientRect();
    
        const cursorX = event.clientX || (event.touches && event.touches[0].clientX);
        const cursorY = event.clientY || (event.touches && event.touches[0].clientY);
    
        let top = cursorY - 200;
        let left = cursorX - 200;
    
        // Check for right overflow
        if ((cursorX + tooltipRect.width + 20) > window.innerWidth) {
            left = cursorX - tooltipRect.width - 15;
        }
    
        // Check for bottom overflow
        if ((cursorY + tooltipRect.height + 20) > window.innerHeight) {
            top = cursorY - tooltipRect.height - 15;
        }
    
        // Set position
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    function hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
    }
}
