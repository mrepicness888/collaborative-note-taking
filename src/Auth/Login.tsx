import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { normaliseEmail } from "../helpers/email";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const signIn = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: normaliseEmail(email),
      password,
    });
    if (error) setError(error.message);
    if (!error) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="login"
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="login"
      />

      {error && <p className="red">{error}</p>}

      <button onClick={signIn}>Login</button>

      <p style={{ marginTop: "1rem" }}>
        Don’t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
