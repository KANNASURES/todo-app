/* =============================================
   TASK ROUTES — StudyFlow
   Maps HTTP methods + URLs to controller fns
============================================= */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/taskController');

/* ─── TASK ROUTES ───────────────────────────

   GET    /api/tasks              → get all tasks
   POST   /api/tasks              → create task
   PUT    /api/tasks/:id          → update task
   PATCH  /api/tasks/:id/complete → toggle complete
   DELETE /api/tasks/:id          → delete task

──────────────────────────────────────────── */

router.get   ('/',             controller.getAllTasks);
router.post  ('/',             controller.createTask);
router.put   ('/:id',          controller.updateTask);
router.patch ('/:id/complete', controller.toggleComplete);
router.delete('/:id',          controller.deleteTask);

module.exports = router;