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
const joinedEvents = db.collection("joinedEvents");

await joinedEvents.createIndex(
  { userId: 1, eventId: 1 },
  { unique: true },
);


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


app.delete("/events/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await events.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    res.send({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);

    res.status(500).send({
      message: "Failed to delete event",
    });
  }
});

app.post("/joined-events", async (req, res) => {
  const { userId, eventId } = req.body;

  try {
    // Find the original event
    const event = await events.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    // Check whether the event date has passed
    if (event.eventDate < new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Dhaka",
    })) {
      return res.status(400).send({
        message: "This event has already ended",
      });
    }

    // Check whether the user has already joined
    const alreadyJoined = await joinedEvents.findOne({
      userId: userId,
      eventId: eventId,
    });

    if (alreadyJoined) {
      return res.status(409).send({
        message: "You have already joined this event",
      });
    }

    // Save the event information with the user's registration
    const joinedEvent = {
      userId,
      eventId,
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: event.eventDate,
      location: event.location,
      image: event.image,
      joinedAt: new Date(),
    };

    const result = await joinedEvents.insertOne(joinedEvent);

    res.status(201).send({
      message: "You have successfully joined this event",
      result,
    });
  } catch (error) {
    console.error("Error joining event:", error);

    res.status(500).send({
      message: "Failed to join event",
    });
  }
});

app.get("/joined-events/:userId", async (req, res) => {
  const { userId } = req.params;

  const result = await joinedEvents.find({
    userId: userId,
  }).toArray();

  res.send(result);
});

app.delete("/joined-events/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await joinedEvents.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Joined event not found",
      });
    }

    res.send({
      message: "Event removed from your joined events",
    });
  } catch (error) {
    console.error("Error removing joined event:", error);

    res.status(500).send({
      message: "Failed to remove joined event",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
