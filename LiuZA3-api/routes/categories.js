/**
 * routes/categories.js
 * GET /api/categories - returns all event categories used to populate the
 * category filter on the Search page.
 */
const express = require('express');
const { query } = require('../event_db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT c.category_id, c.category_name, c.description,
             (SELECT COUNT(*) FROM events e
               WHERE e.category_id = c.category_id
                 AND e.status = 'active'
                 AND e.event_date >= CURDATE()) AS upcoming_event_count
      FROM categories c
      ORDER BY c.category_name ASC;
    `;
    const categories = await query(sql);
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
