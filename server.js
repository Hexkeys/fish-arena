import express from "express";

const app = express();
const PORT = Number(process.env.APP_PORT || 10000);

app.get("/health", (_req, res) => res.json({ ok: true, service: "remote-device" }));
app.use(express.static("public"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Remote device web server listening on port ${PORT}`);
});
