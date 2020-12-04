//////
const express = require("express");
const app = express();
const cors = require('cors')
const bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors())
//////
let passwords = new Map();
let channels = new Map();
let channelLogins = new Map();
//////

app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;
  console.log("password", password);
  
  //Error messages
  if (passwords.has(username)) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }
  if (username === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  } else if (password === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  
  // Success
  passwords.set(username, password);
  res.send(JSON.stringify({ success: true }));
});

app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body)
  let username = parsed.username
  let actualPassword = parsed.password
  let expectedPassword = passwords.get(username)
  let genToken = Math.random().toString(36).substr(2, 5);
  
  //Error messages
  if (username === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return
  } else if (actualPassword === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return
  }
  
  if (expectedPassword === undefined) {
      res.send(JSON.stringify({ success: false, reason: "User does not exist" }))
      return
  }
  if (expectedPassword !== actualPassword) {
      res.send(JSON.stringify({ success: false, reason: "Invalid password" }))
      return
  }
  
  // Success
  channelLogins.set(genToken, username)
  passwords.set(genToken, username);
  res.send(JSON.stringify({ success: true,"token": genToken }))
});

app.post("/create-channel", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channel = parsed.channelName;
  
    //Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channel === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } else if (channels.has(channel)) {
        res.send(JSON.stringify({ success: false, reason: "Channel already exists" }))
        return
    }
  
  // Object for upcomnig endpoints
  let channelInfo = {
    admin: token, 
    users: new Map(), 
    banned: new Map()
  }
  // Success 
  channels.set(channel, channelInfo);
  res.send(JSON.stringify({ success: true }))
});

app.post("/join-channel", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channelName = parsed.channelName;
    
    //Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
    
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
    
    if (channels.get(channelName)["users"].has(token)) { 
        res.send(JSON.stringify({ success: false, reason: "User has already joined" }))
        return
    }
  
    if (channels.get(channelName)["banned"].has(token)) {
        res.send(JSON.stringify({ success: false, reason: "User is banned" }))
        return
    }
  
  //Success
  channels.get(channelName)["users"].set(token, channelLogins.get(token))
  res.send(JSON.stringify({ success: true }))
  console.log(channels)
});

app.post("/leave-channel", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channelName = parsed.channelName;
    
    //Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
    
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
    
    if (!channels.get(channelName)["users"].has(token)) {
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }
  
  //Success
  channels.get(channelName)["users"].delete(token)
  res.send(JSON.stringify({ success: true }))
});

app.get("/joined", (req, res) => {
  let channel = req.query.channelName
  let token = req.headers.token
    
    // Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
    
    if (!channels.has(channel)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    if (!channels.get(channel)["users"].has(token)) {
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }
    // Success
  
    // Array containing usernames of people in specified channel
    let names = []
    ///
    let allUsers = channels.get(channel)["users"]
    console.log("allUsers: " + allUsers)
    // for...of loop to iterate through the keys and values of the users Map
    // and push the key values to the array
    for (let [key, value] of allUsers) {
      names.push(allUsers.get(key))
    }
    res.send(JSON.stringify({ success: true, "joined":names }))
});

app.post("/delete", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channelName = parsed.channelName;
  
    //Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
    
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
  
  // Success 
  channels.delete(channelName)
  res.send(JSON.stringify({ success: true }))
});

// function used for the tagergeted username in the /kick and /ban endpoints
let mapKey = (user) => {
  
  let uniqueToken
  //for...of loop
  for (let [key, value] of channelLogins) {
      if (value === user)
          uniqueToken = key
    }
  
  return uniqueToken
  
}


app.post("/kick", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channelName = parsed.channelName
  let targetUsr = parsed.target
  
    // Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
  
    if (targetUsr === undefined) {
        res.send(JSON.stringify({ success: false, reason: "target field missing" }))
        return
    }
    
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
  
    if (token != channels.get(channelName)["admin"]) {
        res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
        return
    }
  
  // Success
  let theKey = mapKey(targetUsr)
  channels.get(channelName)["users"].delete(theKey)
  res.send(JSON.stringify({ success: true }))
});

app.post("/ban", (req, res) => {
  let parsed = JSON.parse(req.body)
  let token = req.headers.token
  let channelName = parsed.channelName
  let targetUsr = parsed.target
  
    // Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
  
    if (targetUsr === undefined) {
        res.send(JSON.stringify({ success: false, reason: "target field missing" }))
        return
    }
    
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
  
    if (token != channels.get(channelName)["admin"]) {
        res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
        return
    }
  
  // Success
  let theKey = mapKey(targetUsr)
  channels.get(channelName)["banned"].set(theKey, targetUsr)
  res.send(JSON.stringify({ success: true }))
});

// Array to store all messages
let messages = []

app.post("/message", (req, res) => {
  let parsed = JSON.parse(req.body)
  let channelName = parsed.channelName
  let contents = parsed.contents
  let token = req.headers.token
  
    // Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
  
    if (contents === undefined) {
        res.send(JSON.stringify({ success: false, reason: "contents field missing" }))
        return
    }
    
    if (!channels.has(channelName) || !channels.get(channelName)["users"].has(token)) {
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }
    
    // Success
    let msg = {"from": channelLogins.get(token), "contents": contents}
    messages.push(msg) // pushing all the messages to the array 
    res.send(JSON.stringify({success: true}))
});


app.get("/messages", (req, res) => {
  let token = req.headers.token
  let channelName = req.query.channelName
  
  // Error messages
    if (token === undefined) {
        res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
        return
    }
  
    if (!passwords.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName === undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
    
    if (!channels.get(channelName)["users"].has(token)) {
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }
    
    // Success
    res.send(JSON.stringify({success: true, messages: messages}))
});


app.get("/sourcecode", (req, res) => {
  res.send(require('fs').readFileSync(__filename).toString())
});

// listen for requests :)
app.listen(process.env.PORT || 3000) 