document.addEventListener('DOMContentLoaded', function() {
    // Monitor for timeline tab activation
    document.querySelector('[data-tab="timeline-view"]').addEventListener('click', function() {
        if (!window.timelineInitialized) {
            initializeTimeline();
            window.timelineInitialized = true;
        }
    });
});

function initializeTimeline() {
    fetch('data/tariff_data.json')
        .then(response => response.json())
        .then(data => {
            // Process data for timeline events
            const events = processTimelineEvents(data);
            
            // Render the timeline
            renderTimeline(events);
            
            // Setup timeline controls
            setupTimelineControls(events);
        })
        .catch(error => {
            console.error("Error loading timeline data:", error);
            document.querySelector('.timeline-events').innerHTML = 
                '<p class="error-message">Error loading timeline data. Please try again later.</p>';
        });
}

function processTimelineEvents(data) {
    const events = [];
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    
    // Extract events from tariff data
    Object.entries(data).forEach(([country, tariffs]) => {
        tariffs.forEach(tariff => {
            // Add announcement event
            if (tariff.date_announced && dateFormat.test(tariff.date_announced)) {
                events.push({
                    date: new Date(tariff.date_announced),
                    type: 'announcement',
                    country: country,
                    target: tariff.target,
                    rate: tariff.rate,
                    description: `${country}: Announced ${typeof tariff.rate === 'number' ? (tariff.rate * 100).toFixed(1) + '%' : tariff.rate} tariff on ${tariff.target || 'goods'}`
                });
            }
            
            // Add implementation event
            if (tariff.date_in_effect && dateFormat.test(tariff.date_in_effect) && 
                tariff.date_in_effect !== 'TBD' && tariff.date_in_effect !== 'Exempt') {
                events.push({
                    date: new Date(tariff.date_in_effect),
                    type: 'implementation',
                    country: country,
                    target: tariff.target,
                    rate: tariff.rate,
                    description: `${country}: Implemented ${typeof tariff.rate === 'number' ? (tariff.rate * 100).toFixed(1) + '%' : tariff.rate} tariff on ${tariff.target || 'goods'}`
                });
            }
        });
    });
    
    // Sort events by date
    return events.sort((a, b) => a.date - b.date);
}

function renderTimeline(events) {
    if (events.length === 0) {
        document.querySelector('.timeline-events').innerHTML = 
            '<p class="no-events">No tariff events found in the selected date range.</p>';
        return;
    }
    
    // Get earliest and latest dates
    const earliestDate = events[0].date;
    const latestDate = events[events.length - 1].date;
    
    // Update datepicker ranges
    document.getElementById('start-date').value = earliestDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = latestDate.toISOString().split('T')[0];
    
    // Calculate timeline range
    const timelineRange = latestDate - earliestDate;
    const timelineDays = timelineRange / (1000 * 60 * 60 * 24);
    
    // Create month markers
    const timelineScale = document.querySelector('.timeline-markers');
    timelineScale.innerHTML = '';
    
    let currentDate = new Date(earliestDate);
    currentDate.setDate(1); // Start at beginning of month
    
    while (currentDate <= latestDate) {
        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        marker.innerHTML = `<span>${monthName} ${currentDate.getFullYear()}</span>`;
        
        // Position marker based on date
        const position = ((currentDate - earliestDate) / timelineRange) * 100;
        marker.style.left = `${position}%`;
        
        timelineScale.appendChild(marker);
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Render events on timeline
    const timelineEvents = document.querySelector('.timeline-events');
    timelineEvents.innerHTML = '';
    
    const lanes = [0, 1, 2]; // Timeline lanes to prevent overlapping events
    const assignedLanes = {};
    
    events.forEach((event, index) => {
        const eventEl = document.createElement('div');
        eventEl.className = `timeline-event event-${event.type}`;
        
        // Position based on date
        const position = ((event.date - earliestDate) / timelineRange) * 100;
        eventEl.style.left = `${position}%`;
        
        // Assign to a lane (simple algorithm to prevent overlap)
        let lane = 0;
        while (lane < lanes.length) {
            const lastEventInLane = assignedLanes[lane];
            if (!lastEventInLane || position - lastEventInLane > 10) {
                break;
            }
            lane++;
        }
        
        if (lane >= lanes.length) {
            lane = lane % lanes.length; // Wrap around if needed
        }
        
        eventEl.style.top = `${lane * 60 + 10}px`;
        assignedLanes[lane] = position;
        
        // Color based on type
        if (event.type === 'announcement') {
            eventEl.style.backgroundColor = '#3498db';
        } else if (event.type === 'implementation') {
            eventEl.style.backgroundColor = '#e74c3c';
        }
        
        eventEl.innerHTML = `<div class="event-date">${event.date.toLocaleDateString()}</div>
                            <div class="event-desc">${event.description}</div>`;
        
        // Add click handler for details
        eventEl.addEventListener('click', () => {
            showEventDetails(event);
        });
        
        timelineEvents.appendChild(eventEl);
    });
}

function showEventDetails(event) {
    // Create or update a modal with event details
    let modal = document.getElementById('event-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'event-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    const rateDisplay = typeof event.rate === 'number' ? 
        (event.rate * 100).toFixed(1) + '%' : event.rate;
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>${event.country} Tariff ${event.type === 'announcement' ? 'Announcement' : 'Implementation'}</h3>
            <div class="modal-body">
                <p><strong>Date:</strong> ${event.date.toLocaleDateString()}</p>
                <p><strong>Product:</strong> ${event.target || 'All goods'}</p>
                <p><strong>Tariff Rate:</strong> ${rateDisplay}</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <div class="modal-actions">
                    <button class="action-button" id="show-on-map">
                        <i class="fas fa-map-marker-alt"></i> View on Map
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.querySelector('#show-on-map').addEventListener('click', () => {
        // Switch to map view and focus on country
        document.querySelector('[data-tab="map-view"]').click();
        
        // Simple delay to ensure map is loaded
        setTimeout(() => {
            // Find and click the country on the map
            const countryElements = document.querySelectorAll('.country');
            countryElements.forEach(el => {
                if (el.__data__ && el.__data__.properties.name === event.country) {
                    el.dispatchEvent(new Event('click'));
                }
            });
        }, 300);
        
        modal.style.display = 'none';
    });
    
    modal.style.display = 'flex';
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function setupTimelineControls(allEvents) {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const playButton = document.getElementById('play-timeline');
    
    // Filter events based on date range
    function filterEventsByDateRange() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        const filteredEvents = allEvents.filter(event => {
            return event.date >= startDate && event.date <= endDate;
        });
        
        renderTimeline(filteredEvents);
    }
    
    // Date range change handlers
    startDateInput.addEventListener('change', filterEventsByDateRange);
    endDateInput.addEventListener('change', filterEventsByDateRange);
    
    // Play animation functionality
    let animation;
    
    playButton.addEventListener('click', () => {
        if (animation) {
            // Stop animation
            clearInterval(animation);
            animation = null;
            playButton.innerHTML = '<i class="fas fa-play"></i> Play Timeline';
            return;
        }
        
        // Start animation
        playButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        const totalDuration = 10000; // 10 seconds for full timeline
        const stepSize = 86400000; // 1 day in milliseconds
        
        let currentDate = new Date(startDate);
        
        animation = setInterval(() => {
            currentDate = new Date(currentDate.getTime() + stepSize * 7); // Advance by 1 week
            
            if (currentDate > endDate) {
                clearInterval(animation);
                animation = null;
                playButton.innerHTML = '<i class="fas fa-play"></i> Play Timeline';
                return;
            }
            
            // Highlight events that happen on or before current date
            const currentEvents = document.querySelectorAll('.timeline-event');
            
            currentEvents.forEach(eventEl => {
                const eventDate = new Date(eventEl.querySelector('.event-date').textContent);
                
                if (eventDate <= currentDate) {
                    eventEl.classList.add('event-active');
                } else {
                    eventEl.classList.remove('event-active');
                }
            });
            
            // Show current date indicator
            let dateIndicator = document.querySelector('.current-date-indicator');
            
            if (!dateIndicator) {
                dateIndicator = document.createElement('div');
                dateIndicator.className = 'current-date-indicator';
                document.querySelector('.timeline-events').appendChild(dateIndicator);
            }
            
            const timelineRange = endDate - startDate;
            const position = ((currentDate - startDate) / timelineRange) * 100;
            dateIndicator.style.left = `${position}%`;
            dateIndicator.textContent = currentDate.toLocaleDateString();
            
        }, 100); // Update every 100ms
    });
}

// Add CSS for timeline modal
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            z-index: 2000;
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            position: relative;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .modal-close {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        .modal-body {
            margin-top: 15px;
        }
        
        .modal-actions {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        
        .timeline-event {
            padding: 8px;
            border-radius: 4px;
            position: absolute;
            min-width: 120px;
            color: white;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: transform 0.15s ease-in-out;
            z-index: 1;
        }
        
        .timeline-event:hover {
            transform: scale(1.05);
            z-index: 10;
        }
        
        .event-date {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 3px;
        }
        
        .event-active {
            box-shadow: 0 0 10px yellow;
            transform: scale(1.05);
            z-index: 5;
        }
        
        .current-date-indicator {
            position: absolute;
            height: 100%;
            width: 2px;
            background-color: red;
            top: 0;
            z-index: 100;
            font-size: 10px;
            color: red;
            font-weight: bold;
            padding-top: 5px;
            text-align: center;
        }
        
        .timeline-marker {
            position: absolute;
            bottom: 0;
            font-size: 11px;
            color: #666;
            transform: translateX(-50%);
            padding-bottom: 5px;
            border-left: 1px solid #ddd;
            height: 100%;
            padding-left: 5px;
        }
    `;
    document.head.appendChild(style);
});