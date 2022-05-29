import http from 'http';
import app from './app'
import auth from './middleware/auth';
import authRoutes from './routes/auth-routes';

const { API_PORT } = process.env;

app.use("/api/users", authRoutes);

app.get("/welcome_with_auth", auth, (req, res) => {
  res.status(200).send("Welcome");
});

const server = http.createServer(app);

server.listen(API_PORT, () => {
    console.log(`Server running on port ${API_PORT}`);
});
