const net = require("net");
const {handleUser,handlePassword} = require("./authorization.js");
const {handleNlist} = require("./list.js");
var command = null;
var args = [];
var connectedUser = null;
class FtpServer{
    constructor(){
        this.remotePort = null;
        this.localPort = 21;
        this.remoteAddress = null;
        this.localAddress = "localhost";
        this.userDetails = [];
    }

    initiateFtpServer(){
        const ftpServer = net.createServer((ftpSocket)=>{
            ftpSocket.write("220 Service ready for new user\r\n")
            ftpSocket.on("connect",()=>{
            })

            ftpSocket.on("data",(data)=>{
                let parsedData = data.toString().split(" ");
                command = parsedData[0].replace("\r\n","").toUpperCase();
                args = parsedData.slice(1);
                args = args.map((value)=>{return value.replace("\r\n","").trim()})
                console.log(command,args);
                switch(command){
                    case "USER":{
                        connectedUser = handleUser(ftpSocket,args,this.userDetails);
                        command = null;
                        args = [];
                        break;
                    }
                    case "PASS":{
                        handlePassword(ftpSocket,args,connectedUser);
                        command = null;
                        args = [];
                        break;
                    }
                    case "PORT":{
                        let [a1,a2,a3,a4,p1,p2] = args[0].split(',');
                        p2.replace("\r\n","");
                        p1 = Number.parseInt(p1);
                        p2 = Number.parseInt(p2);
                        this.remotePort = p1*256 + p2;
                        this.remoteAddress = `${a1}.${a2}.${a3}.${a4}`;
                        ftpSocket.write("200 PORT Okay\r\n")
                        command = null;
                        args = [];
                        break;
                    }
                    case "NLST":{
                        handleNlist(ftpSocket,args,connectedUser,this.remoteAddress,this.remotePort);
                        command = null;
                        args = [];
                        break;
                    }
                    case "OPTS":{
                        ftpSocket.write("200 Always in UTF8 mode\r\n");
                        break;
                    }
                    case "QUIT":{
                        ftpSocket.end("221 Service closing control connection");
                        break;
                    }
                }
            })

            ftpSocket.on("error",(error)=>{
                console.log(error);
            })

            ftpSocket.on("close",(error)=>{
                if(error){
                    console.log("Socket had a transmission error")                    
                }else{
                    console.log("Connection Closed.") 
                }
            })
        })
        ftpServer.listen(this.localPort,()=>{
            console.log(`Starting FTP Service at port ${this.localPort}`)
        }) 
    }
}


let s = new FtpServer();
s.userDetails = [{name:"abc",password:"123",pwd:"E://project/ftp-for-node"}]
s.initiateFtpServer();