import { QRCodeSVG } from "qrcode.react";
import { Button } from "flowbite-react";
import { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../../hooks/useSocketContext";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../../components/logout-button";
import toast from "react-hot-toast";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const { socket } = useSocketContext();

  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    socket.on("socket_connected", (msg) => {
      toast.success(msg);
    });

    socket.on("authenticated", (msg) => {
      console.log(msg);
      toast.success(msg);
      navigateRef.current("/chat");
    });

    socket.on("ready", (msg) => {
      console.log(msg);
      toast.success(msg);
      navigateRef.current("/chat");
    });

    socket.on("qr_received", (qr) => {
      toast.success(`QR recibido!`);
      setQrCode(qr);
    });
  }, [qrCode, socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center mb-6">Bienvenido!</h1>
        <QRCodeSVG value={qrCode} size={200} />
        {qrCode && (
          <div className="w-full text-black">
            Código: <p className="w-full break-words">{qrCode}</p>
          </div>
        )}
        <p className="text-center text-gray-600 mt-6">
          Escanea el código QR para iniciar sesión
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Utiliza el scaner de la app de WhatsApp en tú teléfono.
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          ¿Ya has iniciado sesión?
        </p>
        <div className="flex flex-col justify-center items-center gap-2">
          <Button
            onClick={() => {
              navigateRef.current("/chat");
            }}
          >
            Chatea ahora
          </Button>
          <LogoutButton></LogoutButton>
        </div>
      </div>
    </div>
  );
};
