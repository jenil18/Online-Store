import { useState } from "react";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    phone: "",
    altPhone: "",
    email: "",
    salon: "",
    address: "",
    city: "",
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = () => {
    const {
      phone,
      email,
      salon,
      address,
      city,
      username,
      password,
    } = form;

    if (
      !phone ||
      !email ||
      !salon ||
      !address ||
      !city ||
      !username ||
      !password
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.find((u) => u.username === username);

    if (userExists) {
      alert("Username already taken.");
      return;
    }

    users.push({
      ...form,
      password: hashedPassword,
    });

    localStorage.setItem("users", JSON.stringify(users));
    alert("Registration successful!");
    navigate("/login");
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
      <h1 className="text-3xl mb-6 font-bold">Register</h1>
      <div className="bg-white text-black p-8 rounded-xl shadow-lg space-y-4 w-full max-w-md">
        {[
          { name: "username", placeholder: "Username" },
          { name: "phone", placeholder: "Phone Number" },
          { name: "altPhone", placeholder: "Alternate Number" },
          { name: "email", placeholder: "Email" },
          { name: "salon", placeholder: "Salon Name" },
          { name: "address", placeholder: "Address" },
          { name: "city", placeholder: "City" },
        ].map(({ name, placeholder }) => (
          <input
            key={name}
            name={name}
            type="text"
            placeholder={placeholder}
            className="w-full p-2 border rounded"
            value={form[name]}
            onChange={handleChange}
          />
        ))}

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={form.password}
          onChange={handleChange}
        />

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
