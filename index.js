const MongoClient = require("mongodb").MongoClient;
const dotenv = require("dotenv").config();
const express = require("express");
const userHandlers = require("./user/userHandlers.js");
const messageHandlers = require("./messaging/messageHandlers.js");
const path = require("path");
const multer = require("multer");
var cors = require("cors");

async function main() {
    //Database setup
    const uri = process.env.DB_URI;
    let db;
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();

    db = client.db("StudyRooms");

    ///Images folder setup
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "images/");
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + ".jpg"); //Appending .jpg
        },
    });
    const upload = multer({
        dest: "images",
        limits: {
            fileSize: 32000000,
        },
        storage: storage,
    });

    //Routes

    const app = express();
    app.use("/images", express.static(path.join(__dirname + "/images")));

    app.use(cors());
    app.use(express.json());
    app.post("/api/register", (req, res) => {
        userHandlers.registerUser(db, req, res);
    });

    app.post("/api/login", (req, res) => {
        userHandlers.loginUser(db, req, res);
    });

    app.post("/api/logout", (req, res) => {
        userHandlers.logoutUser(db, req, res);
    });

    app.post("/api/sendMessage", (req, res) => {
        messageHandlers.sendMessage(db, req, res);
    });

    app.post("/api/sendPicture", upload.single("image"), (req, res) => {
        messageHandlers.sendPicture(db, req, res);
    });

    app.post("/api/getMessages", (req, res) => {
        messageHandlers.getMessages(db, req, res);
    });
    //Start server
    app.listen(8080, () => {
        console.log("started on 8080");
    });
}

main();
