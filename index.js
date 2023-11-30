const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// verify middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "access denied" });
  }
  jwt.verify(token, process.env.TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "access denied" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yshawkz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // data collection form server
    const featuredCollection = client.db("webtecDb").collection("featured");
    const trendingCollection = client.db("webtecDb").collection("trending");
    const reviewsCollection = client.db("webtecDb").collection("reviews");
    const allProductsCollection = client.db("webtecDb").collection("allProducts");
    const reportsCollection = client.db("webtecDb").collection("reports");
    const userCollection = client.db("webtecDb").collection("allUsers");

    // JWT related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ auth: true });
    });

    // Clear cokkie API
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", { maxAge: 0, secure: true, sameSite: "none" })
        .send({ clear: true });
    });

// all products related api
app.get("/allproducts", async (req, res) => {
  const cursor = allProductsCollection.find().sort({ timestamp: -1 });
  const result = await cursor.toArray();
  res.send(result);
});

app.put("/upVotes/allproducts/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = req.body;
  const updatedVotes = {
    $set: {
      votes: updatedDoc.updatedVoteCount,
      votedBy: updatedDoc.votedBy,
    },
  };

  const result = await allProductsCollection.updateOne(
    filter,
    updatedVotes,
    options
  );
  res.send(result);
});


app.get("/allproducts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await allProductsCollection.findOne(query);
  res.send(result);
});


    // Featured api collection get
    app.get("/featured", async (req, res) => {
      const cursor = featuredCollection.find().sort({ timestamp: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/featured/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const identifier = req.body;
      const updatedData = {
        $set: {
          status: identifier.status,
        },
      };
      const result = await featuredCollection.updateOne(filter, updatedData);
      res.send(result);
    });

    app.get("/featured/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await featuredCollection.findOne(query);
      res.send(result);
    });

    // Trending api collection get
    app.get("/trending", async (req, res) => {
      const cursor = trendingCollection.find().sort({ timestamp: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/trending/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await trendingCollection.findOne(query);
      res.send(result);
    });

    app.put("/upVotes/trending/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = req.body;
      const updatedVotes = {
        $set: {
          votes: updatedDoc.updatedVoteCount,
          votedBy: updatedDoc.votedBy,
        },
      };

      const result = await trendingCollection.updateOne(
        filter,
        updatedVotes,
        options
      );
      res.send(result);
    });

    // updated upvoted related api
    app.put("/upVotes/featured/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = req.body;
      const updatedVotes = {
        $set: {
          votes: updatedDoc.updatedVoteCount,
          votedBy: updatedDoc.votedBy,
        },
      };

      const result = await featuredCollection.updateOne(
        filter,
        updatedVotes,
        options
      );
      res.send(result);
    });

    // reviews related api
    app.post("/reviews", async (req, res) => {
      const reviewData = req.body;
      const result = await reviewsCollection.insertOne(reviewData);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const reviewData = req.body;
      const result = await reviewsCollection.find(reviewData).toArray();
      res.send(result);
    });

    // report related api
    app.post("/reports", async (req, res) => {
      const reportData = req.body;
      const result = await reportsCollection.insertOne(reportData);
      res.send(result);
    });

    // Users related api
    app.post("/allUsers", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // All user api
    app.get("/allUsers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // JWT related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ auth: true });
    });

    // Clear cokkie API
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", { maxAge: 0, secure: true, sameSite: "none" })
        .send({ clear: true });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// root
app.get("/", (req, res) => {
  res.send("Web Tec server is running");
});

app.listen(port, () => {
  console.log(`Web Tec server is running on port: ${port}`);
});
