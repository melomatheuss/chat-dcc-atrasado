const http = require('http')
const { Server } = require("socket.io")

const httpServer = http.createServer();

const PORT = process.env.PORT || 3001

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
})

const usersOnline = {};
let typingUsers = []; 

io.on("connection", async (socket) => {


    socket.on("join_room", (userName) => {
        console.log(`Username: ${userName} - Socket: ${socket.id}`);
        usersOnline[socket.id] = userName;
        io.emit("updateUserList", Object.values(usersOnline));
        io.emit("userConnected", userName);// Emita evento quando um usuário se conectar
    });

    socket.on("userTyping", (isTyping, userName) => {
        if (isTyping) {
            typingUsers.push(userName);
        } else {
            const index = typingUsers.indexOf(userName);
            if (index !== -1) {
                typingUsers.splice(index, 1);
            }
        }
        io.emit("updateTypingUsers", typingUsers);
    });

    socket.on("disconnect", () => {
        if (usersOnline[socket.id]) {
            const disconnectedUser = usersOnline[socket.id];
            delete usersOnline[socket.id];
            io.emit("updateUserList", Object.values(usersOnline));
            io.emit("userDisconnect", disconnectedUser);
            console.log(`User disconnected: ${disconnectedUser}`);
        }
    });

 

    socket.on("send-message", (msg) => {
        console.log(msg, "MSG RECEBIDA NO SERVIDOR"); 
        io.emit("receive-msg", msg); 
    });
    
});

httpServer.listen(PORT, () => {
    console.log(`socket.io server esta rodadando na porta ${PORT}`)
})

