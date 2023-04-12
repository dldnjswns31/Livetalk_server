"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const http_errors_1 = __importDefault(require("http-errors"));
const db_1 = __importDefault(require("./apis/db"));
const routes_1 = __importDefault(require("./routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const socket_1 = require("./socket");
require("dotenv").config();
// mongoose connect
db_1.default;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(server);
app.set("io", (0, socket_1.getIO)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://livetalk-client.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
app.use("/", routes_1.default);
app.use("/auth", auth_1.default);
app.use("/chat", chat_1.default);
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
const errorHandler = (err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
};
app.use(errorHandler);
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on ${port} port...`);
});
exports.default = app;
