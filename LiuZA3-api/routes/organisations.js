/**
 * routes/organisations.js
 * ---------------------------------------------------------------------------
 * GET /api/organisations
 * Returns the charitable organisations that host events. The admin Create /
 * Update event form uses this list to populate the "hosted by" selector.
 * ---------------------------------------------------------------------------
 */
const express = require('express');
const { query } = require('../event_db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT o.org_id, o.org_name, o.mission, o.contact_email, o.contact_phone,
             (SELECT COUNT(*) FROM events e WHERE e.org_id = o.org_id)
               AS event_count
      FROM organisations o
      ORDER BY o.org_name ASC;
    `;
    const organisations = await query(sql);
    res.json({
      success: true,
      count: organisations.length,
      data: organisations,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
