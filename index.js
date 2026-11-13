import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//localhost:5000
const client = new MongoClient(
  process.env.MONGODB_URI
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

app.post("/events",async(req, res)=>{
  const data= req.body

  const result= await events.insertOne(data)
  res.send(result)
})

app.get("/events", async (req, res) => {
  const result = await events.find().toArray();

  res.send(result);
});

app.get("/events/:id", async (req, res) => {
  const { id } = req.params;

  const result = await events.findOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

app.get("/my-events/:userId", async (req, res) => {
  const { userId } = req.params;

  const result = await events.find({ createdBy: userId }).toArray();

  res.send(result);
});

app.patch("/events/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const result = await events.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: updatedData.title,
          description: updatedData.description,
          category: updatedData.category,
          eventDate: updatedData.eventDate,
          location: updatedData.location,
          image: updatedData.image,
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    const updatedEvent = await events.findOne({
      _id: new ObjectId(id),
    });

    res.send(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);

    res.status(500).send({
      message: "Failed to update event",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
