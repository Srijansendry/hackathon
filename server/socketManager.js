let _io = null

export function setIo(io) {
  _io = io
}

export function emitToUser(userId, event, data) {
  if (_io && userId) {
    _io.to(`user:${userId}`).emit(event, data)
  }
}
