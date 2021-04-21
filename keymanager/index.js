const express = require("express");
const MongoClient = require("mongodb").MongoClient;
var cors = require("cors");

const uri =
    "mongodb+srv://admin:keymanagerpassword@cluster0.wd5gm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
let db;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const app = express();
app.use(cors());
app.use(express.json());

const port = 8000;
client.connect().then(() => {
    db = client.db("keymanager");
});

app.post("/", (req, res) => {
    let categoryName = req.body.category;
    if (categoryName) {
        db.collection("categories").findOne(
            { categoryName: categoryName },
            (findError, findData) => {
                if (findError) res.status(500).send("DB error");
                else if (findData) {
                    res.status(200).send(findData._id);
                } else {
                    db.collection("categories").insertOne(
                        { categoryName: categoryName },
                        (insertError, insertData) => {
                            if (insertError) {
                                res.status(500).send(
                                    "Could not create custom key"
                                );
                            } else {
                                if (insertData) {
                                    res.status(200).send(insertData.insertedId);
                                } else
                                    res.status(500).send(
                                        "DB error , could not return the key of the new category"
                                    );
                            }
                        }
                    );
                }
            }
        );
    } else res.status(401).send("Not enough data provided");
});

app.listen(port, () => {
    console.log(`listening on ${port}`);
});
