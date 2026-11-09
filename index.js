import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//localhost:5000
const client = new MongoClient(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-8dvaw4g-shard-00-00.2zg1dp9.mongodb.net:27017,ac-8dvaw4g-shard-00-01.2zg1dp9.mongodb.net:27017,ac-8dvaw4g-shard-00-02.2zg1dp9.mongodb.net:27017/?ssl=true&replicaSet=atlas-hfbbla-shard-0&authSource=admin`,
);
export async function connectToMongoDB() {

  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient= await connectToMongoDB();
const db= connectedClient.db('kinderoDB');
const events= db.collection('events');


app.get("/", (req, res) => {
  res.send({ msg: "Hello World" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
