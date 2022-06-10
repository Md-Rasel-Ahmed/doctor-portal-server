const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
// midleware
app.use(cors());
app.use(express.json());
let sendGridApiKey =
  "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";
const uri =
  "mongodb+srv://mongodbUser:hSMFLPo6zrAqzr8w@cluster0.6plls.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

var options = {
  auth: {
    api_key: sendGridApiKey,
  },
};

var sendGridCliend = nodemailer.createTransport(sgTransport(options));

const sendEmail = (appoinment) => {
  //  email, servicesName, date, time,
  const { email, servicesName, date, time } = appoinment;
  const emailSend = {
    from: "FeidhoRasel@gmail.com",
    to: email,
    subject: servicesName,
    text: `apnar services name aita seita aisa kdfj dkfj ${date} time holo ${time}`,
    html: "<b>Hello world</b>",
  };

  sendGridCliend.sendMail(emailSend, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log("Message sent: " + info);
    }
  });
};

async function run() {
  try {
    await client.connect();
    const appoinmentCollection = client
      .db("doctorServices")
      .collection("services");
    const userAppoinmentCollection = client
      .db("doctorServices")
      .collection("userAppoinment");
    const usersCollection = client.db("doctorServices").collection("user");
    const doctorsCollection = client.db("doctorServices").collection("doctor");
    //   get the all data
    app.get("/", async (req, res) => {
      const query = {};
      const cursor = appoinmentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/userAppoinment", async (req, res) => {
      let appoinment = req.body;
      sendEmail(appoinment);
      const result = await userAppoinmentCollection.insertOne(appoinment);
      res.send({ success: true, result });
    });
    app.put("/userAppoinment/:id", async (req, res) => {
      let id = req.params.id;
      let filter = { _id: ObjectId(id) };
      let options = { upsert: true };
      const updateDoc = {
        $set: { paid: true },
      };
      const result = await userAppoinmentCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      res.send(result);
    });

    //
    app.get("/userAppoinment", async (req, res) => {
      let email = req.query.email;
      const query = { email: email };
      const cursor = userAppoinmentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // available services
    app.get("/available", async (req, res) => {
      const date = req.query.date;
      // get all services
      const allServices = await appoinmentCollection.find().toArray();
      // get bookin services
      const query = { date: date };
      const bookings = await userAppoinmentCollection.find(query).toArray();
      allServices.forEach((service) => {
        const booked = bookings.filter(
          (book) => book.servicesName === service.name
        );
        const bookedSlots = booked.map((book) => book.time);
        service.slots = service.slots.filter((s) => !bookedSlots.includes(s));
      });
      res.send(allServices);
    });

    // user added or replace on the database
    app.put("/user", async (req, res) => {
      let filter = { name: req.body.email };
      let data = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: data,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // user role change api
    app.put("/user/admin/:email", async (req, res) => {
      let email = req.params.email;
      let filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      let query = {};
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // doctor api
    app.post("/doctor", async (req, res) => {
      let doctor = req.body;
      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    });
    // doctor api
    app.get("/doctor", async (req, res) => {
      const query = {};
      const cursor = doctorsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
