import React from "react";
import { Link } from "react-router-dom";

const UserNotFound = () => (
  <section className="min-h-screen flex flex-col justify-center items-center bg-red-100">
    <h1 className="text-4xl font-bold text-red-600 mb-4">User Not Found</h1>
    <p className="mb-6 text-lg text-gray-700">
      The username or password you entered is incorrect or not registered.
    </p>
    <Link to="/login" className="text-blue-600 underline">
      Back to Login
    </Link>
  </section>
);

export default UserNotFound; 