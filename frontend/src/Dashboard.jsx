import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const createForm = () => {
    const newId = Date.now().toString();
    navigate(`/form/${newId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">Forms</h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {user?.name || user?.email}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-8">

        <h2 className="text-xl font-semibold mb-4">
          Start a new form
        </h2>

        <div className="flex gap-6 mb-12">

          {/* Blank Form */}
          <div
            onClick={createForm}
            className="w-48 h-56 bg-white rounded-xl shadow cursor-pointer flex flex-col items-center justify-center hover:shadow-lg transition"
          >
            <div className="text-4xl text-purple-600">+</div>
            <p className="mt-4 font-medium">Blank Form</p>
          </div>

          {/* Contact Template */}
          <div
            onClick={createForm}
            className="w-48 h-56 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition p-4"
          >
            <div className="h-32 bg-green-100 rounded mb-4"></div>
            <p className="font-medium">Contact Information</p>
          </div>

          {/* RSVP Template */}
          <div
            onClick={createForm}
            className="w-48 h-56 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition p-4"
          >
            <div className="h-32 bg-blue-100 rounded mb-4"></div>
            <p className="font-medium">RSVP</p>
          </div>

          {/* Feedback Template */}
          <div
            onClick={createForm}
            className="w-48 h-56 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition p-4"
          >
            <div className="h-32 bg-yellow-100 rounded mb-4"></div>
            <p className="font-medium">Event Feedback</p>
          </div>

        </div>

        <h2 className="text-xl font-semibold mb-4">
          Recent forms
        </h2>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="h-32 bg-purple-100 rounded mb-3"></div>
            <p className="font-medium">Untitled Form</p>
            <p className="text-sm text-gray-500">
              Last edited just now
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}