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
                    console.log(err);
                    console.log(data);

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
        if (err) res.status(401).send("Nu aveti cont in aplicatie");
        else if (sha256.x2(userData.password) === data.password) {
            var token = jwt.sign({ userID: ObjectID(data._id) }, privateKey);
            res.status(200).send({
                response: "V-ati autentificat cu succes!",
                jwt: token,
                grade: data.grade,
                firstName: data.firstName,
                lastName: data.lastName,
            });
        }
    });
}

function getProfile(db, req, res) {
    let userID = req.params.id;
    db.collection("Users").findOne({ _id: ObjectID(userID) }, (err, data) => {
        if (err)
            res.status(401).send({
                reason: "No user exists with the specified ID",
            });
        else if (data) {
            delete data.password;
            delete data.email;
            res.status(200).send(data);
        } else {
            res.status(401).send("oops");
        }
    });
}
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getProfile = getProfile;
