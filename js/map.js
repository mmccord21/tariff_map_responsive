document.addEventListener('DOMContentLoaded', function() {
    // Add mobile detection
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    // Load the tariff data and world map
    Promise.all([
        d3.json('data/tariff_data.json'),
        d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
    ]).then(([tariffData, worldData]) => {
        createMap(tariffData, worldData, isMobile);
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
        if (window.matchMedia('(max-width: 768px)').matches) {
            renderMobileCards(data);
        } else {
            renderDesktopTable(data);
        }
    }

    function renderMobileCards(data) {
        // Clear the table container completely first
        const tableContainer = document.getElementById('table-container');
        tableContainer.innerHTML = '';
        
        if (data.length === 0) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'no-data';
            noDataDiv.textContent = 'No matching tariff data found';
            tableContainer.appendChild(noDataDiv);
            return;
        }
        
        // Create a fresh card container
        const cardContainer = document.createElement('div');
        cardContainer.id = 'card-container';
        cardContainer.className = 'mobile-card-container';
        tableContainer.appendChild(cardContainer);
        
        // Add cards for each item
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'tariff-card';
            
            card.innerHTML = `
                <h3>${item.country}</h3>
                <div class="card-rate">${typeof item.rate === 'number' ? (item.rate * 100).toFixed(1) + '%' : item.rate || 'N/A'}</div>
                <div class="card-details">
                    <div><strong>Target:</strong> ${item.target || 'N/A'}</div>
                    <div><strong>Announced:</strong> ${item.date_announced || 'N/A'}</div>
                    <div><strong>Effective:</strong> ${item.date_in_effect || 'N/A'}</div>
                    <div><strong>Authority:</strong> ${item.legal_authority || 'N/A'}</div>
                    <div><strong>Source:</strong> ${item.sources || 'N/A'}</div>
                </div>
            `;
            
            cardContainer.appendChild(card);
        });
    }

    function renderDesktopTable(data) {
        // First make sure the table exists
        const tableContainer = document.getElementById('table-container');
        let table = document.getElementById('tariff-table');
        
        // If we switched from mobile to desktop, we need to recreate the table
        if (!table) {
            tableContainer.innerHTML = '';
            table = document.createElement('table');
            table.id = 'tariff-table';
            table.className = 'data-table';
            
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Country</th>
                    <th>Target</th>
                    <th>Tariff Rate</th>
                    <th>Date Announced</th>
                    <th>Date in Effect</th>
                    <th>Legal Authority</th>
                    <th>Source</th>
                </tr>
            `;
            
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            tbody.id = 'tariff-table-body';
            table.appendChild(tbody);
            
            tableContainer.appendChild(table);
        }
        
        // Now fill the table body
        const tableBody = document.getElementById('tariff-table-body');
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

    // Add window resize listener to switch between table and cards
    window.addEventListener('resize', () => {
        const sortSelect = document.getElementById('sort-select');
        renderTable(getFilteredData(sortSelect.value));
    });

    function getFilteredData(sortValue) {
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
        
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            sortedData = sortedData.filter(item => 
                item.country.toLowerCase().includes(searchTerm) || 
                (item.target && item.target.toLowerCase().includes(searchTerm))
            );
        }
        
        return sortedData;
    }
}

function createMap(tariffData, worldData, isMobile) {
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
        // Update mobile detection on resize
        const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
        d3.select('#map svg').remove();  // Remove existing SVG
        createMap(tariffData, worldData, isMobileNow); // Recreate with new size
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
            if (!isMobile) { // Only show tooltip on hover for desktop
                const countryName = d.properties.name;
                if (countryName && tariffData[countryName]) {
                    d3.select(this).style('stroke-width', '1.5px').style('stroke', '#000');
                    showTooltip(event, countryName, tariffData[countryName], countryTariffPercentages[countryName]);
                }
            }
        })
        .on('mousemove', function(event, d) {
            if (!isMobile) { // Update tooltip position on mouse move for desktop
                const countryName = d.properties.name;
                if (countryName && tariffData[countryName]) {
                    showTooltip(event, countryName, tariffData[countryName], countryTariffPercentages[countryName]);
                }
            }
        })
        .on('mouseout', function() {
            if (!isMobile) { // Only hide on mouseout for desktop
                d3.select(this).style('stroke-width', '0.5px').style('stroke', '#fff');
                hideTooltip();
            }
        })
        .on('click touchend', function(event, d) {
            // This handles both mouse clicks and touch events
            event.preventDefault();
            const countryName = d.properties.name;
            
            // Clear any previously active country
            svg.selectAll('.country').classed('country-active', false);

            // Mark this country as active
            if (isMobile) {
                d3.select(this).classed('country-active', true);
            }

            if (countryName && tariffData[countryName]) {
                // For mobile, toggle tooltip visibility
                const tooltip = document.getElementById('tooltip');
                const isVisible = tooltip.style.display === 'block';
                
                // First hide any visible tooltips
                hideTooltip();
                
                // If the tooltip wasn't visible for this country, show it
                if (!isVisible || tooltip.dataset.country !== countryName) {
                    showTooltip(event, countryName, tariffData[countryName], countryTariffPercentages[countryName]);
                    // Store which country this tooltip is for
                    tooltip.dataset.country = countryName;
                }
            }
        });

    // Add touch event to allow closing the tooltip when tapping elsewhere
    document.getElementById('map').addEventListener('touchstart', function(event) {
        // Check if the touch is directly on the map element and not on a country
        if (event.target.id === 'map' || event.target.tagName === 'svg') {
            hideTooltip();
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
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
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
            ${isMobile ? '<button class="close-tooltip">Close</button>' : ''}
        `;
        
        // Show the tooltip
        tooltip.style.display = 'block';
        
        // Position logic changes for mobile vs desktop
        if (isMobile) {
            // Mobile styling (bottom sheet)
            tooltip.classList.add('mobile-tooltip');
            tooltip.style.position = 'fixed';
            tooltip.style.left = '0';
            tooltip.style.right = '0';
            tooltip.style.bottom = '0';
            tooltip.style.top = 'auto';
            tooltip.style.maxWidth = 'none';
            tooltip.style.width = '100%';
            tooltip.style.maxHeight = '60vh';
            tooltip.style.overflowY = 'auto';
            tooltip.style.borderRadius = '12px 12px 0 0';
            tooltip.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
            tooltip.style.padding = '20px';
            tooltip.style.zIndex = '1500';
            
            // Add semi-transparent overlay
            const overlay = document.createElement('div');
            overlay.className = 'tooltip-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '1400';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', hideTooltip);
            
            // Add click event to close button
            if (document.querySelector('.close-tooltip')) {
                document.querySelector('.close-tooltip').addEventListener('click', function(e) {
                    e.stopPropagation();
                    hideTooltip();
                });
            }
        } else {
            // Desktop styling (hovering tooltip)
            tooltip.classList.remove('mobile-tooltip');
            tooltip.style.position = 'absolute';
            tooltip.style.pointerEvents = 'none';
            // Remove max-height constraint to show all content
            tooltip.style.maxHeight = 'none'; 
            tooltip.style.overflowY = 'visible';
            tooltip.style.maxWidth = '300px';
            tooltip.style.width = 'auto';
            tooltip.style.zIndex = '1000';
            
            // First position tooltip near cursor
            const cursorX = event.clientX || (event.touches && event.touches[0].clientX);
            const cursorY = event.clientY || (event.touches && event.touches[0].clientY);
            const mapRect = document.getElementById('map-container').getBoundingClientRect();
            
            // Make tooltip visible but positioned off-screen temporarily so we can measure it
            tooltip.style.left = '0px';
            tooltip.style.top = '0px';
            
            // Get tooltip dimensions
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipHeight = tooltipRect.height;
            const tooltipWidth = tooltipRect.width;
            
            // Calculate optimal position
            let left = cursorX + 10;
            let top = cursorY + 10;
            
            // Check for right overflow
            if (left + tooltipWidth > window.innerWidth) {
                left = cursorX - tooltipWidth - 10;
            }
            
            // Check for bottom overflow
            if (top + tooltipHeight > window.innerHeight) {
                // If too tall for the screen, position at top of screen with small margin
                top = Math.max(10, cursorY - tooltipHeight - 10);
            }
            
            // Convert to relative position within map container
            left = left - mapRect.left;
            top = top - mapRect.top;
            
            // Apply final position
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        }
    }
    
    function hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
        
        // Remove overlay if it exists
        const overlay = document.querySelector('.tooltip-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Add mobile zoom and pan functionality
    if (isMobile) {
        // Add pinch-zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                svg.selectAll('path')
                    .attr('transform', event.transform);
                svg.selectAll('text')
                    .attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Add better touch feedback
        svg.selectAll('.country')
            .on('touchstart', function() {
                d3.select(this).attr('opacity', 0.7);
            })
            .on('touchend', function() {
                d3.select(this).attr('opacity', 1);
            });
    }
}
