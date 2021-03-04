const e = require("express");
const md5 = require("md5");
const { ObjectID } = require("mongodb");

function registerUser(db, req, res) {
  let userData = req.body.userData;
  console.log(userData);

  db.collection("Users").insertOne(
    {
      email: userData.email,
      password: md5(userData.password),
      firstName: userData.firstName,
      lastName: userData.lastName,
      grade: userData.grade,
    },
    (err, data) => {
      if (err) {
        res
          .status(200)
          .send({ error: "Sunteti deja inregistrat in aplicatie!" });
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
