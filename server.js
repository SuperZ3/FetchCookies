const http = require("http")
const server = http.createServer()
server.on("request", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Method", "*")
    req.on("data", (d) => {
        console.dir(Buffer(d).toString())
    })
    res.end("yes")
})
server.listen(9090, () => console.log('listening...'))
