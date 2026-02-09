import express from "express";
import cors from "cors";

const app = express();
const port = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Health-check Express server running on port ${port}`);
});
