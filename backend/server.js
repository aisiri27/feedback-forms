<<<<<<< HEAD
const eventRoutes = require("./routes/eventRoutes");

require('dns').setDefaultResultOrder('ipv4first');

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 ADD THIS LINE (THIS WAS MISSING)
app.use("/api/events", eventRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.get("/", (req,res)=>{
    res.send("API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("Server running on port " + PORT);
});
=======
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const responseRoutes = require("./routes/responses");

const app = express();
app.use("/responses", responseRoutes);
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
>>>>>>> ac241a3 (Working authentication, form builder UI, partial backend integration)
