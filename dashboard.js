document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Topbar Toggle Logic
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', (e) => {
        sidebar.classList.toggle('open');
        e.stopPropagation();

        if (sidebar.classList.contains('open')) {
            toggleIcon.className = 'fa-solid fa-xmark';
        } else {
            toggleIcon.className = 'fa-solid fa-bars';
        }
    });
    

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('open');
                toggleIcon.className = 'fa-solid fa-bars';
            }
        }
    });

    // 2. Premium Interactive Charting Module
    const ctx = document.getElementById('quotationChart').getContext('2d');
    
    // Dashboard data matrix (to update data according to pills)
    const chartDataVariants = {
        day: [1.0, 1.0],
        week: [5.0, 3.0],
        month: [22.0, 18.0]
    };

    const quotationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Rajesh Tiwari', 'Rajesh Tiwari'],
            datasets: [{
                label: 'Quotations Created',
                data: chartDataVariants.day, // By default 1 and 1 data as per image
                backgroundColor: [
                    '#F472B6', // Soft Pink for Rajeev (As per Image)
                    '#60A5FA'  // Elegant Sky Blue for Kashif Ahmad (As per Image)
                ],
                borderWidth: 0,
                borderRadius: 6,
                barPercentage: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1F2937',
                    padding: 12,
                    titleFont: { size: 13, family: 'Inter', weight: '600' },
                    bodyFont: { size: 13, family: 'Inter' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9CA3AF',
                        font: { family: 'Inter', size: 11 }
                    },
                    grid: { color: '#F3F4F6' }
                },
                x: {
                    ticks: {
                        color: '#4B5563',
                        font: { family: 'Inter', size: 13, weight: '500' }
                    },
                    grid: { display: false }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });

    // 3. Tab Navigation Filter Mechanism
    const pillButtons = document.querySelectorAll('.filter-pills .pill');
    pillButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Reset active class
            pillButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update graph value according to clicked button
            const selectedType = this.textContent.toLowerCase();
            if (chartDataVariants[selectedType]) {
                quotationChart.data.datasets[0].data = chartDataVariants[selectedType];
                quotationChart.update(); // Smooth animation will re-trigger
            }
        });
    });
});




// Data for sales chart
const salesCtx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(salesCtx, {
    type: 'line', // Line chart looks professional
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Sales (in ₹)',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
            x: { grid: { display: false } }
        },
        animation: {
            duration: 2000, // 2 seconds animation
            easing: 'easeInOutQuart'
        }
    }
});