function sendMessage(db, req, res) {
    let messageData = req.body.messageData;
    let userID = req.body.userID;
    db.collection("messages").insertOne({ messageData }, (err, data) => {
        if (err) res.status(401).send({ reason: "Error occured" });
        else {
            res.status(200).send({
                response: "Message sent",
            });
        }
    });
}
