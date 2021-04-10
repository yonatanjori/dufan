const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

let config;
if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  };
}

const pool = new Pool(config);

function isBodyValid(req, requiredAttributes) {
  let valid;
  requiredAttributes.every((val) => {
    valid = ((req.body[val] !== undefined) && (req.body[val] !== ''));
    return valid;
  });
  return valid;
}

express()
  .use(bodyParser.json())
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

    pool.connect().then((client) => {
      return client.query('SELECT * FROM pembacaan').then((result) => {
        client.release();
        return result.rows;
      })
    }).then((results) => {
      res.set('Content-Type', 'text/html');
      res.status(200).send(
        `<html><body>suhu: ${results[0].suhu} <br/> tekanan: ${results[0].tekanan} <br/> ketinggian: ${results[0].ketinggian}</body></html>`
      );
    }).catch((err) => {
      client.release();
      console.log(err.stack);
      res.status(500).json('Informasi prediksi gagal diperoleh');
    });

  })
	.listen(PORT, () => console.log(`Listening on ${PORT}`));
