import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    salon: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { username, email, password, phone, altPhone, address, city, salon } = form;
    if (!username || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      await register({ username, email, password, phone, altPhone, address, city, salon });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
      <h1 className="text-3xl mb-6 font-bold">Register</h1>
      <div className="bg-white text-black p-8 rounded-xl shadow-lg space-y-4 w-full max-w-md">
          <input
          name="username"
            type="text"
          placeholder="Username"
          className="w-full p-2 border rounded"
          value={form.username}
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
            className="w-full p-2 border rounded"
          value={form.email}
            onChange={handleChange}
          />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={form.password}
          onChange={handleChange}
        />
        <input
          name="phone"
          type="text"
          placeholder="Phone Number"
          className="w-full p-2 border rounded"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="altPhone"
          type="text"
          placeholder="Alternate Phone Number"
          className="w-full p-2 border rounded"
          value={form.altPhone}
          onChange={handleChange}
        />
        <input
          name="address"
          type="text"
          placeholder="Address"
          className="w-full p-2 border rounded"
          value={form.address}
          onChange={handleChange}
        />
        <input
          name="city"
          type="text"
          placeholder="City"
          className="w-full p-2 border rounded"
          value={form.city}
          onChange={handleChange}
        />
        <input
          name="salon"
          type="text"
          placeholder="Salon Name"
          className="w-full p-2 border rounded"
          value={form.salon}
          onChange={handleChange}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          onClick={handleRegister}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          Register
        </button>
      </div>
    </section>
  );
};

export default Register;
