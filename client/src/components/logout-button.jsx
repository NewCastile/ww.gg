import { useMutation } from "react-query";
import toast from "react-hot-toast";

import { Button } from "flowbite-react";
import { PowerOff } from "lucide-react";

export const LogoutButton = () => {
  const { mutate: closeSession } = useMutation(
    async () => {
      const request = new Request("http://localhost:4000/logout", {
        method: "POST",
      });

      const response = await fetch(request);

      const responseData = await response.json();

      console.log({ responseData });
    },
    {
      onSuccess: () => {
        toast.success("Se ha cerrado la sesión");
      },
      onError: () => {
        toast.error("Error al cerrar sesión");
      },
    }
  );

  const logout = () => {
    closeSession();
  };

  return (
    <Button className="rounded-full" onClick={logout}>
      <PowerOff className="h-5 w-5 rounded-full mr-2"></PowerOff>
      Cerrar sesión
    </Button>
  );
};
