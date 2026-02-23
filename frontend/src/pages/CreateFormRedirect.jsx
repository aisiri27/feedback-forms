import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreateFormRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const create = async () => {
      try {
        const res = await api.post("/forms", {
          title: "Untitled Form",
          description: "",
          questions: [],
          status: "draft",
        });
        navigate(`/form/${res.data._id}`, { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    };

    create();
  }, [navigate]);

  return <div className="p-8">Creating form...</div>;
}
