const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173' || 'https://daily-news-fd9d3.web.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.01a84k1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);

  // no token available
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const blogCollection = client.db('blogPage').collection('dailyNews')
    const postCollection = client.db('blogPage').collection('postBlog')



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user tokeN', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true });
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logout', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true });
    })



    app.get('/allBlog', async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/allBlog/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await blogCollection.findOne(query)
      res.send(result)
    })

    app.post('/addBlog', async (req, res) => {
      const addPost = req.body;
      const result = await blogCollection.insertOne(addPost);
      res.send(result)
    })

    app.get('/blogs', async (req, res) => {
      const blog = blogCollection.find().sort({ startDate: -1 }).limit(6)
      const result = await blog.toArray()
      res.send(result)
    })


    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await blogCollection.findOne(query)
      res.send(result)
    })

    app.get('/featuredBlog', async (req, res) => {
      const cursor = blogCollection.find().limit(10);
      const result = await cursor.toArray();
      res.send(result);
    })

    
    app.get('/wishlist2', verifyToken, async (req, res) => {
      console.log(req.query.email);
      console.log('cok cok ', req.user);
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        query= {email: req.query.email}
      }
      const result = await postCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/wishlist2', async (req, res) => {
      const cursor = postCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/wishlist2', async (req, res) => {
      const wish = req.body;
      const result = await postCollection.insertOne(wish);
      res.send(result);
    })

    app.delete('/wishlist2', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const result = await postCollection.deleteOne(query)
      res.send(result);
    })

    app.put('/blogsId/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      console.log(update);
      const updateData = {
        $set: {
          title: update.title,
          longDes: update.longDes,
          shortDes: update.shortDes,
          photo: update.photo,
          category: update.category
        }
      }
      const result = await blogCollection.updateOne(
        filter,
        updateData,
        options
      );
      console.log(result);
      res.send(result);
    });


    app.delete('/wishlist2/:id', async (req, res) => {
      const id = req.params.id
      console.log(id);
      const query = { _id: id }
      const result = await postCollection.deleteOne(query)
      res.send(result)
      console.log(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Assignment 11 server is running')
})

app.listen(port, () => {
  console.log(`assignment 11 server running`);
})