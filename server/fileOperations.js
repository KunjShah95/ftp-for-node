const fs = require("fs");
const net = require("net");
const tls = require("tls");
const path = require("path");
const d = new Date();
function connectToClient(ftpSocket,address,port,content,passive,passiveDetails,type,retr=false,makeItActive,auth,secureOptions){
    try{
        if(!content){
            ftpSocket.write("450 Requested file action not taken\r\n");
            return;
        }
    
        if(!address && !port && !passive){
            console.error("Address or port in not correct.");
            ftpSocket.write("502 Command not implemented\r\n");
            return;
        }
        if(passive){
            if(passiveDetails.active){
                if(auth){
                    const dataServer = tls.createServer(secureOptions,(sock)=>{
                        handleSocket(sock,dataServer)
                    });
                    dataServer.on("error",(err)=>{
                        console.log(err);
                        ftpSocket.write("425 Can't open data connection\r\n");
                    })
                    dataServer.listen(passiveDetails.port);
                }else{
                    const dataServer = net.createServer((sock)=>{
                        handleSocket(sock,dataServer)
                    })
                    dataServer.on("error",(err)=>{
                        console.log(err);
                        ftpSocket.write("425 Can't open data connection\r\n");
                    })
                    dataServer.listen(passiveDetails.port);
                }
                function handleSocket(sock,dataServer){
                    sock.setEncoding((type == 'A')?"utf8":null);
                    if(retr){
                        content.pipe(sock);
                    }else{
                        sock.pipe(content);
                    }
                    ftpSocket.write("226 Closing data connection\r\n");
                    sock.on("error",(err)=>{
                        console.log(err);
                        ftpSocket.write("425 Can't open data connection\r\n");
                    })
                    dataServer.close();
                    makeItActive();
                }
            }else{
                ftpSocket.write("421 Service not available\r\n")
            }
        }else{
            let medium = null;
            if(auth){
                medium = tls.connect;
            }else{
                medium = net.createConnection;
            }
                let socket = medium({port:port,host:address,rejectUnauthorized:false},()=>{
                console.log(`Connected to ${address}:${port}`);
                if(retr){
                    content.pipe(socket);
                }else{
                    socket.pipe(content);
                }
                ftpSocket.write("226 Closing data connection\r\n");
    
            })
            socket.on("error",(err)=>{
                console.log(err);
                ftpSocket.write("425 Can't open data connection\r\n");
            })
            socket.setEncoding((type == 'A')?"utf8":null);
            ftpSocket.write("150 File status okay; about to open data connection.\r\n");
        }
    }
    catch(err){
        console.log(err);
        ftpSocket.write("502 Command not implemented\r\n");
    }
}

function handleStor(ftpSocket,args,connectedUser,address,port,passive,passiveDetails,type,makeItActive,auth,secureOptions){
try{
    if(!args.length){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
        }
    let pathname = args.join(" ");
    if(pathname.indexOf('/') == 0 ||pathname.indexOf('./') == 0 || pathname.indexOf('\\') == 0 || pathname.indexOf('.\\') == 0){
            pathname = pathname.replace("./","")
            pathname = pathname.replace("/","")
            pathname = pathname.replace(".\\","")
            pathname = pathname.replace("\\","")
    }
    if(/[/\\]/g.test(pathname)){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
    }
    let content = fs.createWriteStream(path.normalize(`${connectedUser.pwd}/${pathname}`));
    content.on("error",(err)=>{
            console.log(err)
            ftpSocket.write("502 Command not implemented\r\n");
    })
    connectToClient(ftpSocket,address,port,content,passive,passiveDetails,type,false,makeItActive,auth,secureOptions);
}
catch(err){
    console.log(err);
    ftpSocket.write("502 Command not implemented\r\n");
}
   

}

function handleRetr(ftpSocket,args,connectedUser,address,port,passive,passiveDetails,type,makeItActive,auth,secureOptions){
    try{

        if(!args.length){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
        }
        let pathname = args.join(" "),content;
        if(pathname.indexOf('/') == 0 ||pathname.indexOf('./') == 0 || pathname.indexOf('\\') == 0 || pathname.indexOf('.\\') == 0){
            pathname = pathname.replace("./","")
            pathname = pathname.replace("/","")
            pathname = pathname.replace(".\\","")
            pathname = pathname.replace("\\","")
        }
        if(/[/\\]/g.test(pathname)){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
        }
        if(fs.existsSync(path.normalize(`${connectedUser.pwd}/${pathname}`))){
            content = fs.createReadStream(path.normalize(`${connectedUser.pwd}/${pathname}`));
            content.on("error",(err)=>{
                console.log(err)
                ftpSocket.write("502 Command not implemented\r\n");
            })
        }else{
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
        }
        connectToClient(ftpSocket,address,port,content,passive,passiveDetails,type,true,makeItActive,auth,secureOptions);
    }
    catch(err){
        console.log(err);
        ftpSocket.write("502 Command not implemented\r\n");
    }
}

function handleDele(ftpSocket,args,connectedUser){
try{
     if(!args.length){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
     }
     let pathname = args.join(" ");
     if(pathname.indexOf('/') == 0 ||pathname.indexOf('./') == 0 || pathname.indexOf('\\') == 0 || pathname.indexOf('.\\') == 0){
            pathname = pathname.replace("./","")
            pathname = pathname.replace("/","")
            pathname = pathname.replace(".\\","")
            pathname = pathname.replace("\\","")
     }
     if(/[/\\]/g.test(pathname)){
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
     }
     if(fs.existsSync(path.normalize(`${connectedUser.pwd}/${pathname}`))){
            fs.rmSync(path.normalize(`${connectedUser.pwd}/${pathname}`));
            ftpSocket.write("250 Requested file action okay, completed\r\n")
     }else{
            ftpSocket.write("501 Syntax error in parameters or argument\r\n");
            return;
     }
}
catch(err){
    console.log(err);
    ftpSocket.write("502 Command not implemented\r\n");
}
   
    
}

function handleAppe(ftpSocket,args,connectedUser,address,port,passive,passiveDetails,type,makeItActive,auth,secureOptions){
try{
    if(!args.length){
        ftpSocket.write("501 Syntax error in parameters or argument\r\n");
        return;
    }
    let pathname = args.join(" ");
    if(pathname.indexOf('/') == 0 ||pathname.indexOf('./') == 0 || pathname.indexOf('\\') == 0 || pathname.indexOf('.\\') == 0){
        pathname = pathname.replace("./","")
        pathname = pathname.replace("/","")
        pathname = pathname.replace(".\\","")
        pathname = pathname.replace("\\","")
    }
    if(/[/\\]/g.test(pathname)){
        ftpSocket.write("501 Syntax error in parameters or argument\r\n");
        return;
    }
    let content = fs.createWriteStream(path.normalize(`${connectedUser.pwd}/${pathname}`),{flags:'as+'});
    content.on("error",(err)=>{
        console.log(err)
        ftpSocket.write("502 Command not implemented\r\n");
    })
    connectToClient(ftpSocket,address,port,content,passive,passiveDetails,type,false,makeItActive,auth,secureOptions);
}
catch(err){
    console.log(err);
    ftpSocket.write("502 Command not implemented\r\n");
}
   
}

function handleStou(ftpSocket,args,connectedUser,address,port,passive,passiveDetails,type,makeItActive,auth,secureOptions){
  try{
    if(!args.length){
        ftpSocket.write("501 Syntax error in parameters or argument\r\n");
        return;
    }
    let pathname = args.join(" ");
    if(pathname.indexOf('/') == 0 ||pathname.indexOf('./') == 0 || pathname.indexOf('\\') == 0 || pathname.indexOf('.\\') == 0){
        pathname = pathname.replace("./","")
        pathname = pathname.replace("/","")
        pathname = pathname.replace(".\\","")
        pathname = pathname.replace("\\","")
    }
    if(/[/\\]/g.test(pathname)){
        ftpSocket.write("501 Syntax error in parameters or argument\r\n");
        return;
    }
    let content = fs.createWriteStream(path.normalize(`${connectedUser.pwd}/${pathname}_${d.getTime()}`));
    content.on("error",(err)=>{
        console.log(err)
        ftpSocket.write("502 Command not implemented\r\n");
    })
    connectToClient(ftpSocket,address,port,content,passive,passiveDetails,type,false,makeItActive,auth,secureOptions);
  }  
  catch(err){
    console.log(err);
    ftpSocket.write("502 Command not implemented\r\n");
  }
}

exports.handleStor = handleStor;
exports.handleRetr = handleRetr;
exports.handleDele = handleDele;
exports.handleAppe = handleAppe;
exports.handleStou = handleStou;