"client component";
import { useConnection } from "@/context/connect";
import { useEffect, useState, useRef } from "react";

interface IMsgDatTypes {
    user: string;
    msg: string;
    time: string;
    isSystemMessage?: boolean;
}

export default function ChatPage({ userName }: any) {
    const [currentMsg, setCurrentMsg] = useState("");
    const [chatMessages, setChatMessages] = useState<IMsgDatTypes[]>([]);
    const [usersOnline, setUsersOnline] = useState<string[]>([]);
    const [sentMessage, setSentMessage] = useState(false);
   
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const { connection } = useConnection();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (currentMsg !== "" && !sentMessage) {
            setSentMessage(true);
            const newMsg: IMsgDatTypes = {
                user: userName,
                msg: currentMsg,
                time:
                    new Date(Date.now()).getHours() +
                    ":" +
                    new Date(Date.now()).getMinutes(),
            };
            connection.emit("send-message", newMsg);
            setCurrentMsg("");
        }
    }

    useEffect(() => {
        //atualiza a lista de mensagens no cliente
        if (connection) {
            connection.on("receive-msg", (msg: IMsgDatTypes) => {
                setChatMessages((msgs) => [...msgs, msg]);
                setSentMessage(false);
            });
        }
    }, [connection]); 
        
    // Atualizar lista de usuários quando houver alterações
    useEffect(() => {
        if (connection) {
            connection.on('updateUserList', (users: string[]) => {setUsersOnline(users);});}
    }, [connection]);
    //deixa sempre na ultima mensagem enviada
    useEffect(() => {
        if (messagesEndRef.current) {messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });}
    }, [chatMessages]);

    useEffect (() => {
        if(connection){
            connection.on("userConnected", (userName: string) => {
                setChatMessages((msgs) => [
                  ...msgs,
                  {
                    user: "Chat",
                    msg: `Usuário [${userName}] se conectou!`,
                    time:
                      new Date(Date.now()).getHours() +
                      ":" +
                      new Date(Date.now()).getMinutes(),
                  },
                ]);
            }); 
        }
    },[connection]);

    useEffect(() => {
        if (connection) {
          const timeout = setTimeout(() => {
            setIsTyping(false);
          }, 3000); // Assumindo que um usuário está digitando por 2 segundos após a última tecla pressionada
    
          connection.emit("userTyping", isTyping, userName);
    
          return () => clearTimeout(timeout);
        }
    },[isTyping, connection]);

    useEffect(() => {
        if (connection) {
          connection.on("updateTypingUsers", (users: string[]) => {
            setTypingUsers(users);
          });
        }
    }, [connection]);

    useEffect (() => {
        if(connection){
            connection.on("userDisconnect", (userName: string) => {
                setChatMessages((msgs) => [
                  ...msgs,
                  {
                    user: "Chat",
                    msg: `Usuário [${userName}] se desconectou!`,
                    time:
                      new Date(Date.now()).getHours() +
                      ":" +
                      new Date(Date.now()).getMinutes(),
                    },
                ]);
            });

        }
    },[connection]);

    return (
        <main className="flex ">
            {/* barra lateral */}
            <section className="flex flex-col w-96 h-screen bg-[#244254] p-3 gap-6 ">
                <div className="flex flex-col gap-2 text-neutral-800">
                    <span className="font-serif text-2xl font-bold m-2 text-white">USUÁRIOS ONLINE</span>
                    {usersOnline.map((user, index) => (
                        <span key={index} className="pl-5 font-serif text-[20px] font-bold m-2 text-white"> → {user}</span>
                    ))}

                </div>
            </section>
            {/* Main Chat */}
            <section className="flex flex-col w-full h-screen px-10 py-5 bg-[#a9bcc7] justify-between">
                <div className="h-[80vh] overflow-y-auto">
                    {chatMessages.map(({ user, msg, time }, key) => {
                        const isOwnMessage = user === userName;
                        const messageStyle = isOwnMessage ? "bg-gray-300 mr-[500px]" : "bg-gray-200 ml-[500px]";
            
                        return (
                            <div
                                key={key}
                                className={`flex flex-row p-2 text-black  mb-1 place-content-between rounded  ${messageStyle}`}
                                ref={messagesEndRef} 
                            >
                                {!isOwnMessage && (
                                    <div className="text-xs mb-auto mr-2">{time}</div>
                                )}
                                <div className="flex flex-col">
                                    {isOwnMessage ? <span>{msg}</span> : <div><strong>{user}</strong><br/><span>{msg}</span> </div>} 
                                </div>
                                {isOwnMessage && (
                                    <div className="text-xs mb-auto ml-2">{time}</div>
                                )}
                                {/* {typingUsers.length > 0 && (
                                    <div className='flex gap-[5px] flex-end flex-row-reverse mb-[5px] '>
                                        <span>
                                            {typingUsers.filter((user) => user !== userName).map((user, index, array) => (
                                                <span key={user} className="font-style: italic">
                                                    {user}{" "}
                                                    {index === array.length - 1 ? "está digitando..." : ","}{" "}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                )} */}
                            </div>
                        );
                    })}
                    {typingUsers.length > 0 && (
                        <div className='flex gap-[5px] flex-end flex-row-reverse mb-[5px] '>
                            <span>
                                {typingUsers.filter((user) => user !== userName).map((user, index, array) => (
                                    <span key={user} className="font-style: italic">
                                        {user}{" "}
                                        {index === array.length - 1 ? "está digitando..." : ","}{" "}
                                    </span>
                                ))}
                            </span>
                        </div>
                    )}
                </div>
                <div>
                    <form
                        onSubmit={sendMessage}
                        className="flex gap-2 w-full justify-center"
                    >
                        <input
                            type="text"
                            className="rounded px-2 py-3 text-gray-700 border border-gray-400 w-2/3"
                            placeholder="Digite sua mensagem..."
                            value={currentMsg}
                            onChange={(e) =>{setCurrentMsg(e.target.value);setIsTyping(true)}}
                            
                        />
                        <button 
                            type='submit' 
                            className='bg-[#244254] hover:bg-[#355c74] text-white font-bold py-2 px-4 border-b-4 border-[#244254] hover:border-[#355c74] rounded'
                        >
                            enviar
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}


