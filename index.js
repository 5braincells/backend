const MongoClient = require("mongodb").MongoClient;
const dotenv = require("dotenv").config();
const express = require("express");
const userHandlers = require("./user/userHandlers.js");
const messageHandlers = require("./messaging/messageHandlers.js");
const path = require("path");
const multer = require("multer");
var cors = require("cors");
var nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const socket = require("socket.io");
const users = {};

const socketToRoom = {};

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
  const cache = new NodeCache({ stdTTL: 10000, checkperiod: 12000 });

  ///Images folder setup
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "files/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname); //Appending .jpg
    },
  });
  const upload = multer({
    dest: "files",
    limits: {
      fileSize: 32000000,
    },
    storage: storage,
  });

  var mail = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "studyroomsnoreply@gmail.com",
      pass: "RADUSEFULLADESIGN",
    },
  });

  //Routes

  const app = express();
  app.use("/files", express.static(path.join(__dirname + "/files")));

  app.use(cors());
  app.use(express.json());
  app.post("/api/register", (req, res) => {
    userHandlers.registerUser(db, req, res, mail);
  });

  app.post("/api/login", (req, res) => {
    userHandlers.loginUser(db, req, res);
  });

  app.post("/api/logout", (req, res) => {
    userHandlers.logoutUser(db, req, res);
  });

  app.get("/api/profile/:id", (req, res) => {
    userHandlers.getProfile(db, req, res, cache);
  });
  app.post("/api/changeProfile", (req, res) => {
    userHandlers.changeProfile(db, req, res);
  });
  app.post("/api/sendMessage", (req, res) => {
    messageHandlers.sendMessage(db, req, res);
  });

  app.post("/api/sendPicture", upload.single("image"), (req, res) => {
    messageHandlers.sendPicture(db, req, res);
  });
  app.post("/api/sendFile", upload.single("file"), (req, res) => {
    messageHandlers.sendFile(db, req, res);
  });
  app.post("/api/getMessages", (req, res) => {
    messageHandlers.getMessages(db, req, res);
  });
  app.post("/api/deleteMessage", (req, res) => {
    messageHandlers.deleteMessage(db, req, res);
  });
  app.get("/api/generalData", (req, res) => {
    userHandlers.getGeneralData(db, req, res, cache);
  });
  app.get("/api/confirm/:id", (req, res) => {
    userHandlers.confirmAccount(db, req, res);
  });
  //Start server
  const server = app.listen(8080, () => {
    console.log("started on 8080");
  });
  const io = socket(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("join room", (roomID) => {
      if (users[roomID]) {
        const length = users[roomID].length;
        if (length === 10) {
          socket.emit("room full");
          return;
        }
        users[roomID].push(socket.id);
      } else {
        users[roomID] = [socket.id];
      }
      socketToRoom[socket.id] = roomID;
      const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

      socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", (payload) => {
      io.to(payload.userToSignal).emit("user joined", {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    });

    socket.on("returning signal", (payload) => {
      io.to(payload.callerID).emit("receiving returned signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("disconnect", () => {
      const roomID = socketToRoom[socket.id];
      let room = users[roomID];
      if (room) {
        room = room.filter((id) => id !== socket.id);
        users[roomID] = room;
      }
      socket.broadcast.emit("user left", socket.id);
    });
  });
}

main();
