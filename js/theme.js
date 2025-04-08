document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('tariff-map-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        const isDarkTheme = document.body.classList.toggle('dark-theme');
        
        if (isDarkTheme) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('tariff-map-theme', 'dark');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('tariff-map-theme', 'light');
        }
        
        // Redraw visualizations if needed
        if (window.map) {
            // This will trigger map redraw if applicable
            window.dispatchEvent(new Event('resize'));
        }
        
        if (window.currentChart) {
            // Redraw active chart if exists
            window.currentChart.update();
        }
    });
});