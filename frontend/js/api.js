/* =============================================
   API.JS — StudyFlow
   All HTTP calls to the backend live here
   This replaces localStorage with real DB
============================================= */

const API_BASE = 'http://localhost:5000/api';

const TaskAPI = {

    /* ─── GET ALL TASKS ─────────────────────
       Supports filters via query params
    ──────────────────────────────────────── */
    getAll: async function (filters = {}) {
        try {
            // Build query string from filters object
            const params = new URLSearchParams();

            if (filters.category && filters.category !== 'all') {
                params.append('category', filters.category);
            }
            if (filters.priority) {
                params.append('priority', filters.priority);
            }
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.sort) {
                params.append('sort', filters.sort);
            }

            const queryString = params.toString();
            const url = queryString
                ? `${API_BASE}/tasks?${queryString}`
                : `${API_BASE}/tasks`;

            const response = await fetch(url, {
                method:  'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch tasks');
            }

            return data.data; // array of tasks

        } catch (error) {
            console.error('API getAll error:', error);
            throw error;
        }
    },

    /* ─── CREATE TASK ───────────────────────
       Sends new task data to backend
    ──────────────────────────────────────── */
    create: async function (taskData) {
        try {
            const response = await fetch(`${API_BASE}/tasks`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(taskData),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create task');
            }

            return data.data; // newly created task

        } catch (error) {
            console.error('API create error:', error);
            throw error;
        }
    },

    /* ─── UPDATE TASK ───────────────────────
       Sends updated task data to backend
    ──────────────────────────────────────── */
    update: async function (taskId, taskData) {
        try {
            const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(taskData),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to update task');
            }

            return data.data; // updated task

        } catch (error) {
            console.error('API update error:', error);
            throw error;
        }
    },

    /* ─── TOGGLE COMPLETE ───────────────────
       Flips is_completed true/false
    ──────────────────────────────────────── */
    toggleComplete: async function (taskId) {
        try {
            const response = await fetch(
                `${API_BASE}/tasks/${taskId}/complete`,
                {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to toggle task');
            }

            return data.is_completed; // boolean

        } catch (error) {
            console.error('API toggleComplete error:', error);
            throw error;
        }
    },

    /* ─── DELETE TASK ───────────────────────
       Permanently removes task from DB
    ──────────────────────────────────────── */
    delete: async function (taskId) {
        try {
            const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method:  'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to delete task');
            }

            return true;

        } catch (error) {
            console.error('API delete error:', error);
            throw error;
        }
    },
};