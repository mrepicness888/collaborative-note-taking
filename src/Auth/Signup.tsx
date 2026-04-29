import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { normaliseEmail } from "../helpers/email";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const signUp = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: normaliseEmail(email),
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert("Signup successful! You can now log in.");
      navigate("/login", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="login"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="login"
      />

      {error && <p className="red">{error}</p>}

      <button onClick={signUp} disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>

      <p style={{ marginTop: "1rem" }}>
        ALready have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
