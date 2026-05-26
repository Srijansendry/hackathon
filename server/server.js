import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import readingRoutes from './routes/readingRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
})

app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/readings', readingRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const clientDist = path.join(__dirname, '../client/dist')
app.use(express.static(clientDist))
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

const onlineUsers = new Map()

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id)
  })

  socket.on('sendMessage', (data) => {
    const rId = data.receiverId || data.receiver_id
    const receiverSocket = onlineUsers.get(rId)
    if (receiverSocket) {
      io.to(receiverSocket).emit('newMessage', data)
    }
  })

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId)
        break
      }
    }
  })
})

const isProduction = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || (isProduction ? 5000 : 3001)
const HOST = isProduction ? '0.0.0.0' : 'localhost'
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`)
})
