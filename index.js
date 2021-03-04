const MongoClient = require("mongodb").MongoClient;
const dotenv = require("dotenv").config();
const express = require("express");
const userHandlers = require("./user/userHandlers.js");

const uri = process.env.DB_URI;
var db;
async function main() {
  //Database setup

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();

  db = client.db("StudyRooms");

  //Routes

  const app = express();
  app.use(express.json());
  app.post("/api/register", (req, res) => {
    console.log("Ok");
    userHandlers.registerUser(db, req, res);
  });

  app.post("/api/login", (req, res) => {
    userHandlers.loginUser(db, req, res);
  });

  app.post("/api/logout", (req, res) => {
    userHandlers.logoutUser(db, req, res);
  });

  //Start server
  app.listen(8080, () => {
    console.log("started on 8080");
  });
}

main();
