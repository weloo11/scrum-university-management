import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast("Logged in successfully");
      navigate(location.state?.from?.pathname || "/");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_420px]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-copper">University operations</p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Facility reservations and student services in one workspace.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Sign in as an admin, student, or staff user to manage bookings, issues, records, admissions, and transcripts.
        </p>
      </section>
      <form onSubmit={submit} className="panel space-y-4">
        <h2 className="text-xl font-bold text-ink">Login</h2>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className="field mt-1" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className="field mt-1" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="text-sm text-slate-600">
          Need an account? <Link className="font-semibold text-moss" to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      showToast("Account created");
      navigate("/");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <form onSubmit={submit} className="panel space-y-4">
        <h1 className="text-2xl font-bold text-ink">Create Account</h1>
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input className="field mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className="field mt-1" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className="field mt-1" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          New accounts start as regular users. Submit an admission application to become a student after admin approval.
        </p>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </main>
  );
};
