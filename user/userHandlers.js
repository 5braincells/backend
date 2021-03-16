const sha256 = require("sha256");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const { ObjectID } = require("mongodb");

const privateKey = process.env.PRIVATE_KEY;

function registerUser(db, req, res) {
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
                },
                (err, data) => {
                    if (err) {
                        res.status(401).send({
                            reason:
                                "Sunteti deja inregistrat cu acest email in aplicatie!",
                        });
                    } else {
                        var token = jwt.sign(
                            { userID: ObjectID(data._id) },
                            privateKey
                        );
                        res.status(200).send({
                            response:
                                "V-ati inregistrat cu succes! Va rugam verificati mailul pentru confirmare",
                            jwt: token,
                        });
                    }
                }
            );
        } else {
            res.status(401).send({
                reason: "Sunteti deja inregistrat cu acest email in aplicatie!",
                jwt: token,
            });
        }
    });
}

function loginUser(db, req, res) {
    let userData = req.body.userData;
    db.collection("Users").findOne({ email: userData.email }, (err, data) => {
        if (err) res.status(401).send("Nu aveti cont in aplicatie");
        else if (sha256.x2(userData.password) === data.password) {
            var token = jwt.sign({ userID: ObjectID(data._id) }, privateKey);
            res.status(200).send({
                response: "V-ati autentificat cu succes!",
                token,
            });
        }
    });
}

exports.registerUser = registerUser;
exports.loginUser = loginUser;
