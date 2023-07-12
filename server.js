const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const { query } = require("./database");

//middleware
app.use((req, res, next) => {
  res.on("finish", () => {
    // the 'finish' event will be emitted when the response is handed over to the OS
    console.log(`Request: ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});
app.use(express.json());

//get all book records from the DB
app.get("/book", async (req, res) => {
  try {
    const bookList = await query(`SELECT * FROM books`);
    res.status(200).json(bookList.rows);
  } catch (error) {
    console.log(error);
  }
});
// get a single book record from the DB
app.get("/book/:id", async (req, res) => {
  const paramId = req.params.id;

  try {
    const book = await query(`SELECT * FROM books WHERE isbn13 = $1`, [
      paramId,
    ]);
    if (book.rows.length > 0) {
      res.status(200).json(book.rows[0]);
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (error) {
    console.log(error);
  }
});
// update a book record from the DB
app.patch("/book/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const { title, author, genre, quantity } = req.body;
  try {
    const bookUpdated = await query(
      `UPDATE books SET title = $1, author = $2, genre = $3, quantity = $4 WHERE isbn13 = $5 RETURNING *`,
      [title, author, genre, quantity, id]
    );
    res.json(bookUpdated.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

// send a book record to the database
app.post("/book/", async (req, res) => {
  const { isbn13, title, author, genre, quantity } = req.body;
  try {
    const newBook = await query(
      `INSERT INTO books (
        isbn13, 
        title, 
        author, 
        genre,
        quantity
    ) VALUES ($1 , $2 , $3 ,$4 , $5) RETURNING *;`,
      [isbn13, title, author, genre, quantity]
    );
    res.status(201).json(newBook.rows[0]);
  } catch (error) {
    console.log(error);
  }
});
// delete a book from the database
app.delete("/book/:id", async (req, res) => {
  const isbn13 = req.params.id;
  try {
    const deleteQuery = await query(`DELETE FROM books WHERE isbn13 = $1`, [
      isbn13,
    ]);
    if (deleteQuery.rowCount > 0) {
      res.status(200).send({ message: "Book deleted successfully" });
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (error) {}
});

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
