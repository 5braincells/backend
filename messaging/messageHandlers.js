const privateKey = process.env.PRIVATE_KEY;
const { ObjectID } = require("mongodb");
const jwt = require("jsonwebtoken");

function sendMessage(db, req, res) {
    let messageData = req.body.messageData;
    let userID = req.body.userID;
    let jwtDecoded;
    if (req.body.jwt != null) jwtDecoded = jwt.verify(req.body.jwt, privateKey);
    else {
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
                                    res.status(200).send({
                                        response: "Message sent",
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
            res.status(200).send(items);
        });
}
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
