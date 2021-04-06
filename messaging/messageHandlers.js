const privateKey = process.env.PRIVATE_KEY;
const { ObjectID } = require("mongodb");
const jwt = require("jsonwebtoken");
const Pusher = require("pusher");

const pusher = new Pusher({
    appId: "1183448",
    key: "199f3be29f697d6a62f3",
    secret: "c3166677fe3561a1a4f3",
    cluster: "eu",
    useTLS: true,
});
function sendMessage(db, req, res) {
    let messageData = req.body.messageData;
    let userID = req.body.userID;
    console.log(messageData);
    console.log(userID);
    console.log(req.body.jwt);
    let jwtDecoded;
    if (req.body.jwt != null) {
        try {
            jwtDecoded = jwt.verify(req.body.jwt, privateKey);
        } catch (err) {
            console.log(err);
            res.status(401).send({ reason: "JWT is not valid" });
            return;
        }
    } else {
        res.status(401).send("No jwt sent");
        return;
    }
    if (ObjectID(jwtDecoded.userID))
        if (jwtDecoded.userID == userID) {
            console.log(userID);
            console.log(jwtDecoded);
            db.collection("Users").findOne(
                { _id: ObjectID(userID) },
                (err, data) => {
                    if (data == null || err)
                        res.status(401).send({ reason: "UserId is not valid" });
                    else
                        db.collection("messages").insertOne(
                            {
                                type: "msg",
                                message: messageData.message,
                                author: ObjectID(userID),
                                time: Date.now(),
                                category: messageData.category,
                            },
                            (err, data) => {
                                if (err)
                                    res.status(401).send({
                                        reason: "Error occured sending message",
                                    });
                                else {
                                    try {
                                        pusher.trigger(
                                            messageData.category,
                                            "message",
                                            {
                                                message: {
                                                    type: "msg",
                                                    message:
                                                        messageData.message,
                                                    author: ObjectID(userID),
                                                    time: Date.now(),
                                                    category:
                                                        messageData.category,
                                                },
                                            }
                                        );
                                    } catch (err) {
                                        console.log(err);
                                    }
                                    res.status(200).send({
                                        response: "Message sent",
                                        messageData: {
                                            message: messageData.message,
                                            author: ObjectID(userID),
                                            time: Date.now(),
                                            category: messageData.category,
                                        },
                                    });
                                }
                            }
                        );
                }
            );
        }
}

function getMessages(db, req, res) {
    let index = parseInt(req.body.index);
    let category = req.body.category;
    let dataArray;
    let data = db
        .collection("messages")
        .find({})
        .toArray((err, items) => {
            if (err) res.status(404).send("No good");
            res.status(200).send(items);
        });
}

function sendPicture(db, req, res) {
    let filename = req.file.filename;
    let userID = req.body.userID;
    let jwt = req.body.jwt;
    let jwtDecoded;
    if (jwt && userID && filename) {
        try {
            jwtDecoded = jwt.verify(req.body.jwt, privateKey);
        } catch (err) {
            console.log(err);
            res.status(401).send({ reason: "JWT is not valid" });
            return;
        }
        if (ObjectID(jwtDecoded.userID) == userID) {
            db.collection("Users").findOne(
                { _id: ObjectID(jwtDecoded.userID) },
                (err, data) => {
                    if (err) {
                        res.status(401).send({
                            reason: "UserID does not exist",
                        });
                    } else {
                        db.collection("messages").insertOne(
                            {
                                type: "img",
                                filename: filename,
                                author: ObjectID(userID),
                                time: Date.now(),
                                category: messageData.category,
                            },
                            (err, data) => {
                                if (err) {
                                    res.status(401).send({
                                        reason: "Database error",
                                    });
                                } else {
                                    try {
                                        pusher.trigger(
                                            messageData.category,
                                            "message",
                                            {
                                                message: {
                                                    type: "img",
                                                    filename: filename,
                                                    author: ObjectID(userID),
                                                    time: Date.now(),
                                                    category:
                                                        messageData.category,
                                                },
                                            }
                                        );
                                    } catch (err) {
                                        console.log(err);
                                    }
                                    res.status(200).send("Picture sent");
                                }
                            }
                        );
                    }
                }
            );
        }
    } else {
        res.status(401).send({ reason: "Missing data" });
        return;
    }
}
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.sendPicture = sendPicture;
