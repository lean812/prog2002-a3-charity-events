// Local-only static host for the two front-end sites (NOT part of submission).
// Reuses the express already installed inside the API project.
const path = require('path');
const root = path.join(__dirname, '..');
const express = require(path.join(root, 'LiuZA3-api', 'node_modules', 'express'));

const app = express();
app.use('/client', express.static(path.join(root, 'LiuZA3-clientside')));
app.use('/admin', express.static(path.join(root, 'LiuZA3-adminside')));
app.get('/', (req, res) => res.redirect('/client/'));

app.listen(5000, () =>
  console.log('Static sites on http://localhost:5000/client/ and http://localhost:5000/admin/')
);
