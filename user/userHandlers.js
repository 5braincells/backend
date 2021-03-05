const e = require("express");
const md5 = require("md5");
const sha256 = require("sha256");
const { ObjectID } = require("mongodb");

function registerUser(db, req, res) {
  let userData = req.body.userData;

  db.collection("Users").insertOne(
    {
      email: userData.email,
      password: sha256.x2(userData.password),
      firstName: userData.firstName,
      lastName: userData.lastName,
      grade: userData.grade,
    },
    (err, data) => {
      if (err) {
        res.status(401).send({
          reason: "Sunteti deja inregistrat cu acest email in aplicatie!",
        });
      } else {
        res.status(200).send({
          response:
            "V-ati inregistrat cu succes! Va rugam verificati mailul pentru confirmare",
        });
      }
    }
  );
}

exports.registerUser = registerUser;
