import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreateFormRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

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
      } catch (err) {
        setError(err.response?.data?.message || "Failed to create form");
      }
    };

    create();
  }, [navigate]);

  return (
    <div className="p-8">
      {error ? <p className="error-message">{error}</p> : "Creating form..."}
    </div>
  );
}
