/* =============================================
   TASK CONTROLLER — StudyFlow
   All database logic for tasks lives here
============================================= */

const { pool } = require('../config/db');

/* ─── GET ALL TASKS ─────────────────────────
   GET /api/tasks
   Optional query params: category, priority,
   search, sort, completed
──────────────────────────────────────────── */
const getAllTasks = async (req, res) => {
    try {
        const {
            category,
            priority,
            search,
            sort      = 'newest',
            completed,
        } = req.query;

        // Build dynamic WHERE clause
        let conditions = [];
        let values     = [];

        if (category && category !== 'all') {
            conditions.push('category = ?');
            values.push(category);
        }

        if (priority) {
            conditions.push('priority = ?');
            values.push(priority);
        }

        if (search) {
            conditions.push('(title LIKE ? OR description LIKE ?)');
            values.push(`%${search}%`, `%${search}%`);
        }

        if (completed !== undefined && completed !== '') {
            conditions.push('is_completed = ?');
            values.push(completed === 'true' ? 1 : 0);
        }

        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        // Build ORDER BY clause
        let orderBy = 'ORDER BY created_at DESC'; // default: newest
        if (sort === 'oldest')   orderBy = 'ORDER BY created_at ASC';
        if (sort === 'due_date') orderBy = 'ORDER BY due_date ASC NULLS LAST';
        if (sort === 'priority') orderBy = `ORDER BY FIELD(priority, 'high', 'medium', 'low')`;

        const query = `
            SELECT
                id,
                title,
                description,
                category,
                priority,
                DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                TIME_FORMAT(due_time, '%H:%i')     AS due_time,
                is_completed,
                created_at,
                updated_at
            FROM tasks
            ${whereClause}
            ${orderBy}
        `;

        const [rows] = await pool.execute(query, values);

        // Convert is_completed from 0/1 (MySQL) to true/false (JS)
        const tasks = rows.map(task => ({
            ...task,
            is_completed: task.is_completed === 1,
        }));

        res.status(200).json({
            success: true,
            count:   tasks.length,
            data:    tasks,
        });

    } catch (error) {
        console.error('getAllTasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error:   error.message,
        });
    }
};

/* ─── CREATE TASK ───────────────────────────
   POST /api/tasks
──────────────────────────────────────────── */
const createTask = async (req, res) => {
    try {
        const {
            title,
            description = '',
            category    = 'other',
            priority    = 'medium',
            due_date    = null,
            due_time    = null,
        } = req.body;

        // Basic validation
        if (!title || title.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Title is required and must be at least 2 characters',
            });
        }

        const query = `
            INSERT INTO tasks
                (title, description, category, priority, due_date, due_time)
            VALUES
                (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            title.trim(),
            description.trim(),
            category,
            priority,
            due_date  || null,
            due_time  || null,
        ]);

        // Fetch the newly created task to return it
        const [rows] = await pool.execute(
            `SELECT
                id, title, description, category, priority,
                DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                TIME_FORMAT(due_time, '%H:%i')     AS due_time,
                is_completed, created_at, updated_at
             FROM tasks WHERE id = ?`,
            [result.insertId]
        );

        const newTask = {
            ...rows[0],
            is_completed: false,
        };

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data:    newTask,
        });

    } catch (error) {
        console.error('createTask error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            error:   error.message,
        });
    }
};

/* ─── UPDATE TASK ───────────────────────────
   PUT /api/tasks/:id
──────────────────────────────────────────── */
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            priority,
            due_date,
            due_time,
        } = req.body;

        // Check task exists
        const [existing] = await pool.execute(
            'SELECT id FROM tasks WHERE id = ?', [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        if (!title || title.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Title is required',
            });
        }

        const query = `
            UPDATE tasks SET
                title       = ?,
                description = ?,
                category    = ?,
                priority    = ?,
                due_date    = ?,
                due_time    = ?,
                updated_at  = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await pool.execute(query, [
            title.trim(),
            description || '',
            category    || 'other',
            priority    || 'medium',
            due_date    || null,
            due_time    || null,
            id,
        ]);

        // Return updated task
        const [rows] = await pool.execute(
            `SELECT
                id, title, description, category, priority,
                DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                TIME_FORMAT(due_time, '%H:%i')     AS due_time,
                is_completed, created_at, updated_at
             FROM tasks WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data:    { ...rows[0], is_completed: rows[0].is_completed === 1 },
        });

    } catch (error) {
        console.error('updateTask error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            error:   error.message,
        });
    }
};

/* ─── TOGGLE COMPLETE ───────────────────────
   PATCH /api/tasks/:id/complete
──────────────────────────────────────────── */
const toggleComplete = async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const [existing] = await pool.execute(
            'SELECT id, is_completed, title FROM tasks WHERE id = ?', [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        const newStatus = existing[0].is_completed ? 0 : 1;

        await pool.execute(
            'UPDATE tasks SET is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, id]
        );

        res.status(200).json({
            success:      true,
            message:      `Task marked as ${newStatus ? 'completed' : 'incomplete'}`,
            is_completed: newStatus === 1,
        });

    } catch (error) {
        console.error('toggleComplete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle task',
            error:   error.message,
        });
    }
};

/* ─── DELETE TASK ───────────────────────────
   DELETE /api/tasks/:id
──────────────────────────────────────────── */
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            'SELECT id, title FROM tasks WHERE id = ?', [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: `Task "${existing[0].title}" deleted successfully`,
        });

    } catch (error) {
        console.error('deleteTask error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task',
            error:   error.message,
        });
    }
};

module.exports = {
    getAllTasks,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
};