import { useEffect, useRef, useState } from "react";
import { MoreVertical, Send, Paperclip } from "lucide-react";
import {
  Avatar,
  Button,
  Sidebar,
  Textarea,
  Modal,
  Label,
  FileInput,
} from "flowbite-react";
import { useSocketContext } from "../../hooks/useSocketContext";
import { useMutation, useQuery } from "react-query";
import toast from "react-hot-toast";
import { LogoutButton } from "../../components/logout-button";

// #region ChatScreen
export const ChatScreen = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const messageInputRef = useRef();

  const { socket } = useSocketContext();

  const { mutate: postMessage, isLoading: isPostingMessage } = useMutation(
    async () => {
      const request = new Request("http://localhost:4000/sendMessage", {
        method: "POST",
        body: JSON.stringify({
          message: messageText,
          chatId: selectedChatId,
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await fetch(request);

      const responseData = await response.json();

      console.log({ responseData });
    },
    {
      onSuccess: () => {
        toast.success("Mensaje enviado correctamente");
      },
      onError: (error) => {
        console.error(error);
        toast.error("No se ha podido enviar el mensaje");
      },
    }
  );

  const {
    data: chats,
    isLoading: loadingChats,
    isError: chatsOnError,
  } = useQuery("chats", async () => {
    const response = await fetch("http://localhost:4000/getChats");

    const responseData = await response.json();

    return responseData;
  });

  const { data: selectedChat, isLoading: chatIsLoading } = useQuery(
    ["chats", selectedChatId],
    async () => {
      const response = await fetch(
        `http://localhost:4000/getChatBydId?chatId=${selectedChatId}`
      );

      const responseData = await response.json();

      return responseData;
    },
    {
      enabled: !!selectedChatId,
      refetchInterval: 3000,
    }
  );

  useEffect(() => {
    socket.on("socket_connected", (msg) => {
      console.log(msg);
    });
  }, [socket]);

  const sendMessage = () => {
    if (messageText && messageText.length > 0) {
      postMessage();
    }
  };

  if (loadingChats) return <div>Cargando...</div>;
  if (chatsOnError)
    return (
      <div>
        <span>Error</span>
        <Button>Intentalo de nuevo</Button>
      </div>
    );
  if (!chats) return <div>Sin chats</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar className="w-1/3 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <LogoutButton></LogoutButton>
          <Button color="gray" size="sm">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        {/* Search */}
        {/* <div className="p-4 border-b">
          <TextInput icon={Search} placeholder="Search or start new chat" />
        </div> */}
        {/* Chat list */}
        <div className="flex-grow overflow-y-auto">
          {chats.map(({ id, name, lastMessage }) => {
            return (
              <div
                key={id._serialized}
                className={`flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedChatId === id._serialized ? "bg-gray-100" : ""
                }`}
                onClick={() => setSelectedChatId(id._serialized)}
              >
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">{name}</span>
                  </div>
                  {lastMessage && (
                    <p className="break-words text-left text-sm text-gray-600 truncate line-clamp-2">
                      {lastMessage.body}
                    </p>
                  )}
                </div>
                {/* {chat.unreadCount > 0 && (
                <span className="bg-green-500 text-white rounded-full px-2 py-1 text-xs">
                  {chat.unreadCount}
                </span>
              )} */}
              </div>
            );
          })}
        </div>
      </Sidebar>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChat && (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center">
                <Avatar
                  img={`/placeholder.svg?text=${
                    chats.find((c) => c.id === selectedChatId)?.name[0]
                  }`}
                  rounded
                />
                <span className="ml-4 font-semibold">{selectedChat?.name}</span>
              </div>
              <Button color="gray" size="sm">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            {/* Chat messages */}
            <div className="flex flex-col flex-1 overflow-y-auto p-4 bg-gray-100 gap-y-2">
              {selectedChat?.messages.map(({ id, body, fromMe }) => (
                <div
                  key={id._serialized}
                  className={fromMe ? "self-start" : "self-end"}
                >
                  <div
                    className={`inline-block p-3 rounded-lg bg-white border border-slate-600`}
                  >
                    <p className={fromMe ? "text-left" : "text-right"}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Message input */}
            <div className="p-4 bg-white">
              <div className="flex items-center">
                {selectedChatId && (
                  <FileModal chatId={selectedChatId}></FileModal>
                )}
                <Textarea
                  ref={messageInputRef}
                  onChange={(e) => {
                    e.preventDefault();
                    setMessageText(e.target.value);
                  }}
                  className="flex-1"
                  placeholder="Escribe un mensaje"
                />
                <Button
                  color="blue"
                  size="sm"
                  className="ml-2"
                  onClick={sendMessage}
                  disabled={
                    !selectedChat ||
                    !messageText ||
                    chatIsLoading ||
                    isPostingMessage
                  }
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
// #endregion

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

// #region FileModal
export const FileModal = (chatId) => {
  const fileInputRef = useRef(null);

  const [openModal, setOpenModal] = useState(false);

  const { mutate: postMessage, isLoading: isPostingMessage } = useMutation(
    async ({ base64, filename, filesize, mimetype }) => {
      const request = new Request("http://localhost:4000/sendMessage", {
        method: "POST",
        body: JSON.stringify({
          message: base64,
          filename,
          filesize,
          mimetype,
          chatId,
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await fetch(request);

      const responseData = await response.json();

      console.log({ responseData });
    },
    {
      onSuccess: () => {
        toast.success("Archivo enviado correctamente");
      },
      onError: (error) => {
        console.error(error);
        toast.error("No se ha podido enviar el archivo");
      },
    }
  );

  const submitFile = async () => {
    if (fileInputRef.current) {
      const image = fileInputRef.current.files[0];
      const { name: filename, type: mimetype, size: filesize } = image;

      console.log({ filename, mimetype, filesize });

      const base64 = await toBase64(fileInputRef.current.files[0]);

      console.log(base64);

      if (typeof base64 === "string") {
        const falsey = 0;

        if (falsey) {
          postMessage({
            base64,
            filename,
            filesize,
            mimetype,
          });
        }
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenModal(true)} disabled={isPostingMessage}>
        <Paperclip className="h-5 w-5" />
      </Button>
      <Modal
        show={openModal}
        size="md"
        onClose={() => setOpenModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <div>
              <div>
                <Label htmlFor="file-upload" value="Sube un archivo" />
              </div>
              <FileInput
                ref={fileInputRef}
                id="file-upload"
                accept={"image/png, image/jpeg"}
                multiple
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={submitFile}>
                Subir
              </Button>
              <Button color="gray" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};
//#endregion
