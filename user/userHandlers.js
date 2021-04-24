const sha256 = require("sha256");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const { ObjectID, Db } = require("mongodb");

const privateKey = process.env.PRIVATE_KEY;

function registerUser(db, req, res, mail) {
  let userData = req.body.userData;
  db.collection("Users").findOne({ email: userData.email }, (err, data) => {
    if (err) res.status(500).send({ error: "DB did not respond" });
    else if (data == null) {
      db.collection("Users").insertOne(
        {
          email: userData.email,
          password: sha256.x2(userData.password),
          firstName: userData.firstName,
          lastName: userData.lastName,
          grade: userData.grade,
          confirmed: false,
        },
        (err, data) => {
          console.log(err);
          console.log(data);

          if (err) {
            res.status(401).send({
              reason: "Sunteti deja inregistrat cu acest email in aplicatie!",
            });
          } else {
            var token = jwt.sign({ userID: ObjectID(data._id) }, privateKey);
            var mailOptions = {
              from: "studyroomsnoreply@gmail.com",
              to: userData.email,
              subject: "Registered to StudyRooms",
              html: `<h1>This is your confirmation link </h1><a href="35.195.14.52:8080/api/confirm/${data.insertedId}">35.195.14.52:8080/api/confirm/${data.insertedId}</a>`,
            };

            mail.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });
            res.status(200).send({
              response:
                "V-ati inregistrat cu succes! Va rugam verificati mailul pentru confirmare",
              jwt: token,
              grade: data.grade,
              firstName: data.firstName,
              lastName: data.lastName,
            });
          }
        }
      );
    } else {
      res.status(401).send({
        reason: "Sunteti deja inregistrat cu acest email in aplicatie!",
      });
    }
  });
}

function loginUser(db, req, res) {
  let userData = req.body.userData;
  console.log(userData);
  db.collection("Users").findOne({ email: userData.email }, (err, data) => {
    console.log(data);
    if (data && data.confirmed == true) {
      if (err) res.status(401).send({ reason: "Nu aveti cont in aplicatie" });
      else if (sha256.x2(userData.password) === data.password) {
        var token = jwt.sign({ userID: ObjectID(data._id) }, privateKey);
        res.status(200).send({
          response: "V-ati autentificat cu succes!",
          jwt: token,
          grade: data.grade,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      } else {
        res.status(401).send({
          reason: "Mailul sau parola sunt gresite",
        });
      }
    } else {
      res.status(401).send({
        reason: "Nu exista un cont cu acest email sau nu ati validat emailul",
      });
    }
  });
}

function getProfile(db, req, res, cache) {
  let userID = req.params.id;
  let userData = cache.get(req.params.id);
  if (userData == undefined) {
    db.collection("Users").findOne({ _id: ObjectID(userID) }, (err, data) => {
      if (err)
        res.status(401).send({
          reason: "No user exists with the specified ID",
        });
      else if (data) {
        delete data.password;
        delete data.email;
        cache.set(userID, data, 10000);
        res.status(200).send(data);
      } else {
        res.status(401).send("oops");
      }
    });
  } else res.status(200).send(userData);
}
function changeProfile(db, req, res) {
  let userID = req.body.userID;
  let userJwt = req.body.jwt;
  let changes = req.body.changes;
  if (userID && userJwt) {
    try {
      jwtDecoded = jwt.verify(userJwt, privateKey);
    } catch (e) {
      res.status(401).send({ reason: "Jwt not valid" });
    }
    if (jwtDecoded.userID == userID) {
      console.log(changes);
      db.collection("Users").updateOne(
        { _id: ObjectID(userID) },
        { $set: changes },
        (err, data) => {
          res.status(200).send("Changes done");
        }
      );
    }
  } else res.status(401).send({ reason: "missing data" });
}
function getGeneralData(db, req, res, cache) {
  let generalData = cache.get("generalData");
  console.log(generalData);
  if (generalData == undefined) {
    console.log("nice");
    db.collection("Users")
      .countDocuments({})
      .then((data) => {
        db.collection("messages")
          .countDocuments({})
          .then((msgdata) => {
            db.collection("Users")
              .findOne({}, { sort: { _id: -1 }, limit: 1 })
              .then((user) => {
                delete user.password;
                delete user.email;
                delete user._id;
                res.status(200).send({
                  users: data,
                  messages: msgdata,
                  lastUser: user,
                });
                cache.set("generalData", {
                  users: data,
                  messages: msgdata,
                  lastUser: user,
                });
              });
          });
      });
  } else res.status(200).send(generalData);
}
function confirmAccount(db, req, res) {
  let id = req.params.id;
  db.collection("Users").updateOne(
    { _id: id },
    { $set: { confirmed: true } },
    (err, data) => {
      res.status(200).send("Confirmed!");
    }
  );
}
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getProfile = getProfile;
exports.getGeneralData = getGeneralData;
exports.changeProfile = changeProfile;
exports.confirmAccount = confirmAccount;
