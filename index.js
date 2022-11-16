const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qkmdf9o.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client
      .db("doctors_portal")
      .collection("services");

    const bookingCollection = client
      .db("doctors_portal")
      .collection("bookings");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //warning
    // this is the proper way to query
    // after learning more about mongodb use aggregate function lookup, pipeline, match , group

    app.get("/avilable", async (req, res) => {
      const date = req.query.date;

      // step 1: get all services
      const services = await serviceCollection.find().toArray();

      // step 2 : get the booking of that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      //step 3 : for each service
      services.forEach((service) => {
        // step:4 find booking for that services
        const servicebookings = bookings.filter(
          (book) => book.treatment === service.name
        );
        //step: 5 select slots for the service booking

        const bookedSlots = servicebookings.map((book) => book.slot);
        // step:6 select those slots that are not in booked slot
        const avilable = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.slot = avilable;
      });

      res.send(services);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctors portal");
});

app.listen(port, () => {
  console.log("Doctor is waiting for you", port);
});
