const users = [];

// Add user
const addUser = ({id, username, room}) => {
  // Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are required!'
    }
  }

  // Check for existing user
  const existingUser = users.find(user => {
    return user.room === room && user.username === username
  })

  // Validate username
  if (existingUser) {
    return {
      error: "Username is in use"
    }
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
}


// Remove user
const removeUser = (id) => {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get user
const getUser = id => {
  const user = users.find(user => user.id === id);
  return user ? user : { error: 'User not found' };
}
 
// Get users in a room
const getUsers = room => users.filter(user => user.room === room);

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsers
}