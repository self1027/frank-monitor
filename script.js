// System configuration
const LAST_WORKED_DATE = new Date('2025-05-17T00:00:00'); // Frank's last worked date (fixed timezone)
const MONTHS_TO_LOAD = 24; // How many months to load at once
let currentCenterDate = new Date(); // Tracks current view position
let isLoading = false; // Prevents duplicate loading

// DOM elements cache
const statusElement = document.getElementById('status');
const lastWorkedElement = document.getElementById('lastWorkedDate');
const currentDateElement = document.getElementById('currentDate');
const infiniteCalendar = document.getElementById('infinite-calendar');

/**
 * Normalizes date to midnight in local timezone
 * @param {Date} date - Date to normalize
 * @returns {Date} - Normalized date
 */
function normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

/**
 * Checks if Frank is working on a specific date
 * @param {Date} date - Date to check (defaults to today)
 * @returns {boolean} - True if working, false if off
 */
function isFrankWorking(date = new Date()) {
    const normalizedDate = normalizeDate(date);
    const normalizedLastWorked = normalizeDate(LAST_WORKED_DATE);
    
    const timeDiff = normalizedDate - normalizedLastWorked;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Returns true if even number of days since last worked date
    return daysDiff % 2 === 0;
}

/**
 * Generates day cells for calendar
 * @param {number} year - Year of calendar
 * @param {number} month - Month of calendar (0-11)
 * @param {HTMLElement} container - Container to append days to
 */
function generateCalendarDays(year, month, container) {
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Add empty cells for alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
        container.appendChild(document.createElement('div'));
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const isWorkday = isFrankWorking(date);
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        
        const dayElement = document.createElement('div');
        dayElement.className = `day ${isWorkday ? 'workday' : 'offday'} ${isToday ? 'today' : ''}`;
        dayElement.textContent = day;
        dayElement.dataset.date = date.toISOString().split('T')[0];
        container.appendChild(dayElement);
    }
}

/**
 * Generates the current month calendar view
 */
function generateCurrentMonthCalendar() {
    const calendar = document.getElementById('calendar');
    const calendarHeader = document.getElementById('calendar-header');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Clear previous content
    calendar.innerHTML = '';
    calendarHeader.innerHTML = '';
    
    // Add day headers (PT-BR abbreviations)
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        calendarHeader.appendChild(dayHeader);
    });
    
    generateCalendarDays(year, month, calendar);
}

/**
 * Generates a single month calendar for infinite scroll
 * @param {number} year - Year to generate
 * @param {number} month - Month to generate (0-11)
 * @returns {HTMLElement} - Generated month container
 */
function generateMonthCalendar(year, month) {
    const container = document.createElement('div');
    container.className = 'month-container';
    
    // Month title with PT-BR month name
    const title = document.createElement('h3');
    title.className = 'month-title';
    title.textContent = new Date(year, month).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
    });
    container.appendChild(title);
    
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // Add day headers
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.backgroundColor = '#f0f0f0';
        calendarGrid.appendChild(dayHeader);
    });
    
    generateCalendarDays(year, month, calendarGrid);
    container.appendChild(calendarGrid);
    return container;
}

/**
 * Loads months around the center date
 * @param {Date} centerDate - Date to center the view on
 */
function loadMonthsAround(centerDate) {
    if (isLoading) return;
    isLoading = true;
    
    infiniteCalendar.innerHTML = '';
    
    // Calculate date range to display
    const startMonth = centerDate.getMonth() - Math.floor(MONTHS_TO_LOAD / 2);
    const startYear = centerDate.getFullYear() + Math.floor(startMonth / 12);
    const adjustedStartMonth = ((startMonth % 12) + 12) % 12;
    
    // Generate all months in the range
    for (let i = 0; i < MONTHS_TO_LOAD; i++) {
        const currentMonth = adjustedStartMonth + i;
        const currentYear = startYear + Math.floor(currentMonth / 12);
        const actualMonth = currentMonth % 12;
        
        infiniteCalendar.appendChild(generateMonthCalendar(currentYear, actualMonth));
    }
    
    isLoading = false;
}

// Navigation functions
const navigation = {
    today: () => {
        currentCenterDate = new Date();
        loadMonthsAround(currentCenterDate);
        setTimeout(() => {
            document.querySelector('.today')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    },
    prevYear: () => {
        currentCenterDate = new Date(
            currentCenterDate.getFullYear() - 1,
            currentCenterDate.getMonth(),
            currentCenterDate.getDate()
        );
        loadMonthsAround(currentCenterDate);
    },
    nextYear: () => {
        currentCenterDate = new Date(
            currentCenterDate.getFullYear() + 1,
            currentCenterDate.getMonth(),
            currentCenterDate.getDate()
        );
        loadMonthsAround(currentCenterDate);
    }
};

/**
 * Initializes the application
 */
function init() {
    // Set formatted dates in PT-BR locale
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    lastWorkedElement.textContent = LAST_WORKED_DATE.toLocaleDateString('pt-BR', options);
    currentDateElement.textContent = new Date().toLocaleDateString('pt-BR', options);
    
    // Set status message
    const isWorking = isFrankWorking();
    statusElement.textContent = isWorking ? 
        "✅ Sim, Frank está trabalhando hoje!" : 
        "❌ Não, Frank está folgando hoje.";
    statusElement.className = isWorking ? 'working' : 'off';
    
    // Generate initial views
    generateCurrentMonthCalendar();
    loadMonthsAround(currentCenterDate);
    
    // Set up event listeners
    document.getElementById('today').addEventListener('click', navigation.today);
    document.getElementById('prev-year').addEventListener('click', navigation.prevYear);
    document.getElementById('next-year').addEventListener('click', navigation.nextYear);
    infiniteCalendar.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = infiniteCalendar;
        if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading) {
            currentCenterDate = new Date(
                currentCenterDate.getFullYear(),
                currentCenterDate.getMonth() + MONTHS_TO_LOAD/2,
                currentCenterDate.getDate()
            );
            loadMonthsAround(currentCenterDate);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);