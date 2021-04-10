import express from 'express';
import { json } from 'body-parser';

const PORT = process.env.PORT || 5000;

import { Pool } from 'pg';
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

function isBodyValid(req, requiredAttributes) {
  let valid;
  requiredAttributes.every((val) => {
    valid = ((req.body[val] !== undefined) && (req.body[val] !== ''));
    return valid;
  });
  return valid;
}

express()
	.use(json())
  .post('/pembacaan', (req, res) => {

    if (isBodyValid(req, ['suhu', 'tekanan', 'ketinggian'])) {
      pool.connect().then((client) => {
        let query = 'INSERT INTO pembacaan (suhu, tekanan, ketinggian) VALUES ($1, $2, $3)'
        return client.query(query, [req.body.suhu, req.body.tekanan, req.body.ketinggian]).then(() => {
          client.release();
          res.status(200).json('Data pembacaan sensor berhasil disimpan');
        }).catch((err) => {
          client.release();
          console.log(err.stack);
          res.status(500).json('Data pembacaan sensor gagal disimpan');
        });
      });
    } else {
      res.status(400).json('Request body tidak lengkap');
    }

  })
  .get('/prediksi', (req, res) => {

    // WHERE id = MAX(SELECT id FROM pembacaan)
    pool.connect().then((client) => {
      return client.query('SELECT * FROM pembacaan').then((result) => {
        client.release();
        res.status(200).json(result.rows[0]);
      }).catch((err) => {
        client.release();
        console.log(err.stack);
        res.status(500).json('Informasi prediksi gagal diperoleh');
      });
    });

  })
	.listen(PORT, () => console.log(`Listening on ${PORT}`));
