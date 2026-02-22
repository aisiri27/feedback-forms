import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PublicForm() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:5000/forms/${id}`)
      .then(res => setForm(res.data));
  }, [id]);

  const handleSubmit = async () => {
    const formattedAnswers = Object.keys(answers).map(key => ({
      questionId: key,
      answer: answers[key],
    }));

    await axios.post(
      `http://localhost:5000/responses/${id}`,
      { answers: formattedAnswers }
    );

    alert("Response Submitted!");
  };

  if (!form) return <div>Loading...</div>;
  if (!form.isPublished) return <div>This form is not published.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{form.title}</h1>

      {form.questions.map((q) => (
        <div key={q._id} className="mb-4">
          <p className="font-medium">{q.title}</p>

          {q.type === "short" && (
            <input
              className="border w-full"
              onChange={(e) =>
                setAnswers({ ...answers, [q._id]: e.target.value })
              }
            />
          )}

          {q.type === "paragraph" && (
            <textarea
              className="border w-full"
              onChange={(e) =>
                setAnswers({ ...answers, [q._id]: e.target.value })
              }
            />
          )}

          {q.type === "mcq" &&
            q.options.map((opt, i) => (
              <label key={i} className="block">
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q._id]: e.target.value })
                  }
                />
                {opt}
              </label>
            ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </div>
  );
}