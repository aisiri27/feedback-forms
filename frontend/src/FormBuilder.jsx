import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({
  question,
  updateQuestion,
  deleteQuestion,
  isSelected,
  onSelect,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={onSelect}
        className={`bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 ${
          isSelected ? "border-purple-600" : "border-transparent"
        }`}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          className="cursor-move text-gray-400 text-center mb-2"
        >
          ⠿
        </div>

        {/* Title + Type */}
        <div className="flex justify-between items-center mb-4">
          <input
            value={question.title}
            onChange={(e) =>
              updateQuestion(question.id, { title: e.target.value })
            }
            className="text-lg w-full outline-none"
          />

          <select
            value={question.type}
            onChange={(e) =>
              updateQuestion(question.id, { type: e.target.value })
            }
            className="ml-4 border p-2 rounded-md"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
            <option value="paragraph">Paragraph</option>
            <option value="yes_no">Yes / No</option>
          </select>
        </div>

        {/* Render By Type */}
        {question.type === "multiple_choice" && (
          <div>
            {question.options?.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const newOptions = [...question.options];
                  newOptions[i] = e.target.value;
                  updateQuestion(question.id, { options: newOptions });
                }}
                className="block w-full mb-2 border-b outline-none"
              />
            ))}
            <button
              onClick={() =>
                updateQuestion(question.id, {
                  options: [...(question.options || []), "New Option"],
                })
              }
              className="text-purple-600 text-sm"
            >
              + Add Option
            </button>
          </div>
        )}

        {question.type === "short_answer" && (
          <input
            disabled
            placeholder="Short answer text"
            className="w-full border-b outline-none"
          />
        )}

        {question.type === "paragraph" && (
          <textarea
            disabled
            placeholder="Long answer text"
            className="w-full border-b outline-none"
          />
        )}

        {question.type === "yes_no" && (
          <div className="flex gap-6 text-gray-600">
            <span>○ Yes</span>
            <span>○ No</span>
          </div>
        )}

        {/* Required */}
        <div className="flex justify-end mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) =>
                updateQuestion(question.id, {
                  required: e.target.checked,
                })
              }
            />
            Required
          </label>
        </div>
      </div>
    </div>
  );
}

function FormBuilder() {
  const { id } = useParams();
  const location = useLocation();
  const template = location.state;

  const [formTitle, setFormTitle] = useState(
    template?.title || "Untitled Form"
  );

  const [formDescription, setFormDescription] = useState(
    template?.description || ""
  );

  const [questions, setQuestions] = useState(
    template?.questions || [
      {
        id: 1,
        type: "multiple_choice",
        title: "Untitled Question",
        options: ["Option 1"],
        required: false,
      },
    ]
  );

  const [selectedId, setSelectedId] = useState(questions[0].id);

  const addQuestion = () => {
    const newQ = {
      id: Date.now(),
      type: "multiple_choice",
      title: "Untitled Question",
      options: ["Option 1"],
      required: false,
    };
    setQuestions([...questions, newQ]);
    setSelectedId(newQ.id);
  };

  const updateQuestion = (id, updatedFields) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, ...updatedFields } : q
      )
    );
  };

  const deleteQuestion = (id) => {
    const filtered = questions.filter((q) => q.id !== id);
    setQuestions(filtered);
    if (filtered.length) setSelectedId(filtered[0].id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const updated = [...questions];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);

    setQuestions(updated);
  };

  return (
    <div className="min-h-screen bg-[#f0ebf8]">

      <div className="bg-purple-600 h-40 flex items-center px-10 text-white">
        <span className="text-lg font-medium">
          Editing Form ID: {id}
        </span>
      </div>

      <div className="max-w-3xl mx-auto -mt-24 px-4 pb-20 relative">

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-t-8 border-purple-600">
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="text-3xl w-full outline-none"
          />
          <input
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="text-gray-500 w-full outline-none mt-2"
            placeholder="Form description"
          />
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((q) => (
              <SortableItem
                key={q.id}
                question={q}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                isSelected={selectedId === q.id}
                onSelect={() => setSelectedId(q.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Floating Toolbar */}
        <div className="fixed right-10 top-1/3 bg-white shadow-lg rounded-xl p-3 flex flex-col gap-4">

          <button
            onClick={addQuestion}
            className="text-purple-600 text-xl hover:scale-110 transition"
          >
            +
          </button>

          <button
            onClick={() => deleteQuestion(selectedId)}
            className="text-red-500 text-lg hover:scale-110 transition"
          >
            🗑
          </button>

        </div>

      </div>
    </div>
  );
}

export default FormBuilder;