/* =============================================
   APP.JS — StudyFlow Main Application
   All frontend logic lives here
============================================= */

// ─── Global State ────────────────────────────
const App = {
    tasks: [],
    filteredTasks: [],
    activeCategory: 'all',
    filterPriority: '',
    sortOrder: 'newest',
    searchQuery: '',
    editingTaskId: null,
    isLoading: false,   // ← NEW: tracks loading state
};

// ─── Motivational Quotes ─────────────────────
const QUOTES = [
    "💡 'The secret of getting ahead is getting started.' — Mark Twain",
    "🔥 'You don't have to be great to start, but you have to start to be great.' — Zig Ziglar",
    "✨ 'Believe you can and you're halfway there.' — Theodore Roosevelt",
    "📚 'An investment in knowledge pays the best interest.' — Benjamin Franklin",
    "🚀 'Push yourself, because no one else is going to do it for you.'",
    "🌟 'Small steps every day lead to big results.'",
    "💪 'Study hard, dream big, stay humble.'",
    "🎯 'Focus on progress, not perfection.'",
];

// ─── Category Config ─────────────────────────
const CATEGORIES = {
    study: { emoji: '📚', label: 'Study' },
    personal: { emoji: '🏠', label: 'Personal' },
    health: { emoji: '💪', label: 'Health' },
    work: { emoji: '💼', label: 'Work' },
    other: { emoji: '⭐', label: 'Other' },
};

// ─── Priority Config ─────────────────────────
const PRIORITIES = {
    high: { emoji: '🔴', label: 'High' },
    medium: { emoji: '🟡', label: 'Medium' },
    low: { emoji: '🟢', label: 'Low' },
};
/* =============================================
   DATE & GREETING
============================================= */

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '🌅 Good Morning';
    if (hour >= 12 && hour < 17) return '☀️ Good Afternoon';
    if (hour >= 17 && hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
}

function getFormattedDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return now.toLocaleDateString('en-US', options);
}

function getShortDate() {
    const now = new Date();
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    };
    return now.toLocaleDateString('en-US', options);
}

function initDateAndGreeting() {
    // Hero section
    $('#greetingTime').text(getGreeting());
    $('#heroDate').text(getFormattedDate());

    // Navbar short date
    $('#navDate').text(getShortDate());

    // Footer quote — pick a random one
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    $('#footerQuote').text(quote);

    // Update greeting every minute
    setInterval(() => {
        $('#greetingTime').text(getGreeting());
    }, 60000);
}
/* $(document).ready(function () {
    initDateAndGreeting();
}); */
/* =============================================
   UTILITY HELPERS
============================================= */

// Generate unique ID for each task
function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format due date for display on task card
function formatDueDate(dateStr, timeStr) {
    if (!dateStr) return null;

    const due = new Date(dateStr + (timeStr ? 'T' + timeStr : 'T00:00:00'));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

    let label = '';
    if (diffDays < 0) label = `⚠️ Overdue by ${Math.abs(diffDays)} day(s)`;
    else if (diffDays === 0) label = '📅 Due Today';
    else if (diffDays === 1) label = '📅 Due Tomorrow';
    else label = `📅 Due in ${diffDays} days`;

    // Add time if provided
    if (timeStr) {
        const timeObj = new Date(`1970-01-01T${timeStr}`);
        const timeFormatted = timeObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
        label += ` at ${timeFormatted}`;
    }

    return { label, isOverdue: diffDays < 0 };
}

// Check if a task is overdue
function isTaskOverdue(task) {
    if (!task.due_date || task.is_completed) return false;
    const due = new Date(task.due_date + 'T' + (task.due_time || '23:59:00'));
    return due < new Date();
}

// Get today's date string in YYYY-MM-DD format (for date input min)
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
/* =============================================
   STATS & PROGRESS RING
============================================= */

function updateStats() {
    // Always use the FULL App.tasks array for stats
    // (not filteredTasks — stats should reflect ALL tasks)
    const total = App.tasks.length;
    const completed = App.tasks.filter(t => t.is_completed).length;
    const overdue = App.tasks.filter(t => isTaskOverdue(t)).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update numbers
    animateNumber('#statTotal', total);
    animateNumber('#statPending', pending);
    animateNumber('#statCompleted', completed);
    animateNumber('#statOverdue', overdue);

    // Update progress ring
    updateProgressRing(percent);
    $('#progressPercent').text(percent + '%');
}

// Animate number counting up
function animateNumber(selector, target) {
    const el = $(selector);
    const start = parseInt(el.text()) || 0;
    if (start === target) {
        el.text(target);
        return;
    }

    const duration = 600;
    const step = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += step;
        if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
            current = target;
            clearInterval(timer);
        }
        el.text(Math.round(current));
    }, 16);
}

// Update SVG progress ring
function updateProgressRing(percent) {
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // 314.16
    const offset = circumference - (percent / 100) * circumference;
    $('#progressRingFill').css('stroke-dashoffset', offset);
}
/* =============================================
   TASK CARD RENDERER
============================================= */

function buildTaskCard(task) {
    const cat = CATEGORIES[task.category] || { emoji: '⭐', label: task.category };
    const pri = PRIORITIES[task.priority] || { emoji: '🟡', label: task.priority };
    const dueInfo = formatDueDate(task.due_date, task.due_time);
    const overdue = isTaskOverdue(task);
    const checked = task.is_completed ? 'checked' : '';
    const doneClass = task.is_completed ? 'completed' : '';

    // Due date HTML
    let dueHTML = '';
    if (dueInfo) {
        const overdueClass = dueInfo.isOverdue && !task.is_completed ? 'overdue' : '';
        dueHTML = `
            <span class="task-due ${overdueClass}">
                ${dueInfo.label}
            </span>
        `;
    }

    // Description HTML
    const descHTML = task.description
        ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
        : '';

    return `
        <div class="task-card priority-${task.priority} ${doneClass} fade-in-up"
             data-id="${task.id}">

            <!-- Checkbox -->
            <input type="checkbox"
                   class="task-checkbox"
                   data-id="${task.id}"
                   ${checked}
                   title="Mark complete" />

            <!-- Body -->
            <div class="task-body">
                <p class="task-title">${escapeHtml(task.title)}</p>
                ${descHTML}
                <div class="task-meta">
                    <span class="cat-badge ${task.category}">
                        ${cat.emoji} ${cat.label}
                    </span>
                    <span class="priority-badge ${task.priority}">
                        ${pri.emoji} ${pri.label}
                    </span>
                    ${dueHTML}
                </div>
            </div>

            <!-- Actions -->
            <div class="task-actions">
                <button class="btn-task-edit"
                        data-id="${task.id}"
                        title="Edit task">
                    ✏️
                </button>
                <button class="btn-task-delete"
                        data-id="${task.id}"
                        title="Delete task">
                    🗑️
                </button>
            </div>

        </div>
    `;
}

// Prevent XSS — escape user input before injecting into HTML
function escapeHtml(text) {
    return $('<div>').text(text).html();
}
/* =============================================
   RENDER TASK LIST
============================================= */

function renderTasks() {
    let tasks = [...App.tasks];

    // 1. Filter by category
    if (App.activeCategory !== 'all') {
        tasks = tasks.filter(t => t.category === App.activeCategory);
    }

    // 2. Filter by priority
    if (App.filterPriority) {
        tasks = tasks.filter(t => t.priority === App.filterPriority);
    }

    // 3. Filter by search query
    if (App.searchQuery) {
        const q = App.searchQuery.toLowerCase();
        tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
    }

    // 4. Sort tasks
    tasks = sortTasks(tasks, App.sortOrder);

    // Store filtered result
    App.filteredTasks = tasks;

    // Stats always reflect the full task list, even when filters hide every card.
    updateStats();

    const $taskList = $('#taskList');
    const $emptyState = $('#emptyState');

    $taskList.empty();

    if (tasks.length === 0) {
        $emptyState.show();
        return;
    }

    $emptyState.hide();

    // Render each task with staggered animation delay
    tasks.forEach((task, index) => {
        const cardHTML = buildTaskCard(task);
        const $card = $(cardHTML);
        $card.css('animation-delay', (index * 0.06) + 's');
        $taskList.append($card);
    });

}

function sortTasks(tasks, order) {
    return tasks.sort((a, b) => {
        if (order === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        if (order === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        }
        if (order === 'due_date') {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        }
        if (order === 'priority') {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.priority] - order[b.priority];
        }
        return 0;
    });
}
/* =============================================
   ADD TASK
============================================= */

function getFormData() {
    return {
        title: $('#taskTitle').val().trim(),
        description: $('#taskDesc').val().trim(),
        category: $('#taskCategory').val(),
        priority: $('input[name="priority"]:checked').val() || 'medium',
        due_date: $('#taskDueDate').val(),
        due_time: $('#taskDueTime').val(),
    };
}

function validateTask(data) {
    if (!data.title) {
        $('#taskTitle').addClass('shake');
        setTimeout(() => $('#taskTitle').removeClass('shake'), 500);
        showToast('⚠️ Task title is required!', 'error');
        $('#taskTitle').focus();
        return false;
    }
    if (data.title.length < 2) {
        showToast('⚠️ Title must be at least 2 characters!', 'error');
        $('#taskTitle').focus();
        return false;
    }
    return true;
}

function clearForm() {
    $('#taskTitle').val('');
    $('#taskDesc').val('');
    $('#taskCategory').val('');
    $('#taskDueDate').val('');
    $('#taskDueTime').val('');
    $('input[name="priority"][value="medium"]').prop('checked', true);
    $('#taskTitle').focus();
}

// Guard flag — prevents double submission
let isSubmitting = false;

async function addTask() {
    // If already submitting, ignore the call
    if (isSubmitting) return;

    const data = getFormData();
    if (!validateTask(data)) return;

    // Lock submission
    isSubmitting = true;
    $('#addTaskBtn').prop('disabled', true).text('Adding...');

    try {
        const newTask = await TaskAPI.create(data);

        // Add to local state
        App.tasks.unshift(newTask);
        renderTasks();
        updateStats();
        clearForm();
        showToast('✅ Task added successfully!', 'success');

    } catch (error) {
        showToast('❌ Failed to add task. Try again!', 'error');
        console.error('Add task error:', error);
    } finally {
        // Unlock submission
        isSubmitting = false;
        $('#addTaskBtn').prop('disabled', false).text('➕ Add Task');
    }
}
/* =============================================
   DELETE TASK
============================================= */

async function deleteTask(taskId) {
    const task = App.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Animate card out
    const $card = $(`.task-card[data-id="${taskId}"]`);
    $card.css({
        transition: 'all 0.3s ease',
        opacity: '0',
        transform: 'translateX(40px)',
    });

    try {
        await TaskAPI.delete(taskId);

        // Remove from local state as soon as the server confirms deletion.
        App.tasks = App.tasks.filter(t => t.id !== taskId);
        renderTasks();
        showToast(`🗑️ "${task.title}" deleted!`, 'info');

    } catch (error) {
        // Revert animation if failed
        $card.css({
            opacity: '1',
            transform: 'translateX(0)',
        });
        showToast('❌ Failed to delete task!', 'error');
    }
}

/* =============================================
   TOGGLE COMPLETE
============================================= */

async function toggleComplete(taskId) {
    const task = App.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    task.is_completed = !task.is_completed;

    // ✅ Update stats immediately
    updateStats();
    renderTasks();

    try {
        const isCompleted = await TaskAPI.toggleComplete(taskId);

        // Confirm with server
        task.is_completed = isCompleted;

        // ✅ Update stats again after server confirms
        updateStats();
        renderTasks();

        const msg = isCompleted
            ? `🎉 "${task.title}" completed!`
            : `↩️ "${task.title}" marked incomplete`;
        showToast(msg, 'success');

    } catch (error) {
        // Revert on failure
        task.is_completed = !task.is_completed;
        updateStats();
        renderTasks();
        showToast('❌ Failed to update task!', 'error');
    }
}
/* =============================================
   EDIT TASK
============================================= */

function openEditModal(taskId) {
    const task = App.tasks.find(t => t.id === taskId);
    if (!task) return;

    App.editingTaskId = taskId;

    // Fill modal fields
    $('#editTaskId').val(task.id);
    $('#editTaskTitle').val(task.title);
    $('#editTaskDesc').val(task.description || '');
    $('#editTaskCategory').val(task.category || '');
    $('#editTaskDueDate').val(task.due_date || '');
    $('#editTaskDueTime').val(task.due_time || '');

    // Set priority radio
    $(`input[name="editPriority"][value="${task.priority}"]`).prop('checked', true);

    // Show modal
    const modal = new bootstrap.Modal($('#editTaskModal')[0]);
    modal.show();
}

async function saveEdit() {
    const taskId = App.editingTaskId;
    const task = App.tasks.find(t => t.id === taskId);
    if (!task) return;

    const title = $('#editTaskTitle').val().trim();
    if (!title) {
        $('#editTaskTitle').addClass('shake');
        setTimeout(() => $('#editTaskTitle').removeClass('shake'), 500);
        showToast('⚠️ Task title is required!', 'error');
        return;
    }

    // Disable save button
    $('#saveEditBtn').prop('disabled', true).text('Saving...');

    const updatedData = {
        title: title,
        description: $('#editTaskDesc').val().trim(),
        category: $('#editTaskCategory').val() || 'other',
        priority: $('input[name="editPriority"]:checked').val() || 'medium',
        due_date: $('#editTaskDueDate').val() || null,
        due_time: $('#editTaskDueTime').val() || null,
    };

    try {
        const updatedTask = await TaskAPI.update(taskId, updatedData);

        // Update local state
        const index = App.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            App.tasks[index] = {
                ...App.tasks[index],
                ...updatedTask,
            };
        }

        renderTasks();
        updateStats();
        bootstrap.Modal.getInstance($('#editTaskModal')[0]).hide();
        showToast('💾 Task updated successfully!', 'success');
        App.editingTaskId = null;

    } catch (error) {
        showToast('❌ Failed to update task!', 'error');
        console.error('Save edit error:', error);
    } finally {
        $('#saveEditBtn').prop('disabled', false).text('💾 Save Changes');
    }
}
/* =============================================
   LOCAL STORAGE (Temporary until backend)
============================================= */



async function loadTasksFromAPI() {
    // Show loading spinner
    $('#loadingSpinner').show();
    $('#taskList').hide();
    $('#emptyState').hide();

    try {
        App.tasks = await TaskAPI.getAll();
        renderTasks();
        updateStats();
    } catch (error) {
        // Show error state with retry button
        $('#loadingSpinner').hide();
        $('#taskList').html(`
            <div class="api-error-state">
                <div class="api-error-emoji">⚠️</div>
                <h5 class="api-error-title">Cannot connect to server</h5>
                <p class="api-error-subtitle">
                    Make sure your backend is running on port 5000<br>
                    Run: <code>npm run dev</code> in your terminal
                </p>
                <button class="btn-retry" onclick="loadTasksFromAPI()">
                    🔄 Try Again
                </button>
            </div>
        `);
        $('#taskList').show();
        showToast('❌ Cannot connect to server!', 'error');
    } finally {
        $('#loadingSpinner').hide();
        $('#taskList').show();
    }
}
/* =============================================
   EVENT LISTENERS
============================================= */

function initEventListeners() {

    // ── Add Task Button ──────────────────────
    $('#addTaskBtn').off('click').on('click', function () {
        addTask();
    });

    // ── Add Task on Enter key ────────────────
    $('#taskTitle').off('keypress').on('keypress', function (e) {
        if (e.which === 13) addTask();
    });

    // ── Checkbox Toggle ──────────────────────
    $(document).off('change', '.task-checkbox').on('change', '.task-checkbox', function () {
        const taskId = $(this).data('id');
        toggleComplete(taskId);
    });

    // ── Delete Button ────────────────────────
    $(document).off('click', '.btn-task-delete').on('click', '.btn-task-delete', function () {
        const taskId = $(this).data('id');
        const task = App.tasks.find(t => t.id === taskId);
        if (!task) return;
        if (confirm(`🗑️ Delete "${task.title}"?\nThis cannot be undone.`)) {
            deleteTask(taskId);
        }
    });

    // ── Edit Button ──────────────────────────
    $(document).off('click', '.btn-task-edit').on('click', '.btn-task-edit', function () {
        const taskId = $(this).data('id');
        openEditModal(taskId);
    });

    // ── Save Edit Button ─────────────────────
    $('#saveEditBtn').off('click').on('click', function () {
        saveEdit();
    });

    // ── Category Tabs ────────────────────────
    $(document).off('click', '.category-tab').on('click', '.category-tab', function () {
        $('.category-tab').removeClass('active');
        $(this).addClass('active');
        App.activeCategory = $(this).data('category');
        renderTasks();
    });

    // ── Priority Filter ──────────────────────
    $('#filterPriority').off('change').on('change', function () {
        App.filterPriority = $(this).val();
        renderTasks();
    });

    // ── Sort ─────────────────────────────────
    $('#sortTasks').off('change').on('change', function () {
        App.sortOrder = $(this).val();
        renderTasks();
    });

    // ── Search ───────────────────────────────
    let searchTimer;
    $('#searchInput').off('input').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            App.searchQuery = $(this).val().trim();
            renderTasks();
        }, 300);
    });

    // ── Clear Filters ────────────────────────
    $('#clearFilters').off('click').on('click', function () {
        App.searchQuery = '';
        App.filterPriority = '';
        App.sortOrder = 'newest';
        App.activeCategory = 'all';

        $('#searchInput').val('');
        $('#filterPriority').val('');
        $('#sortTasks').val('newest');
        $('.category-tab').removeClass('active');
        $('.category-tab[data-category="all"]').addClass('active');

        renderTasks();
        showToast('🔄 Filters cleared!', 'info');
    });

    // ── Set min date ─────────────────────────
    const today = getTodayString();
    $('#taskDueDate, #editTaskDueDate').attr('min', today);
}
/* =============================================
   MAIN INIT — Called on DOM ready
============================================= */

async function initApp() {
    // 1. Date & greeting
    initDateAndGreeting();

    // 2. Wire up all event listeners
    initEventListeners();

    // 3. Load tasks from REAL backend API
    await loadTasksFromAPI();

    // 4. Set min date on inputs
    const today = getTodayString();
    $('#taskDueDate, #editTaskDueDate').attr('min', today);

    console.log('✅ StudyFlow App initialized with backend!');
    // Hide page loader after everything loads
    setTimeout(() => {
        $('#pageLoader').addClass('hidden');
        setTimeout(() => $('#pageLoader').remove(), 500);
    }, 800);
}

// ─── START THE APP ────────────────────────────
$(document).ready(function () {
    ThemeManager.init();
    initApp();
});