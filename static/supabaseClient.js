import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wvfxtaplwzjwtqsvmano.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Znh0YXBsd3pqd3Rxc3ZtYW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MjM5MDYsImV4cCI6MjA0ODM5OTkwNn0.okfJs5zuyV2vNPQYpfD3TasAOLiRezBF-4huws2BDQM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const loginForm = document.getElementById("auth-form");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const { data, error } = await supabase.auth.signIn({
      email,
      password,
    });
    if (error) {
      console.error(error);
    } else {
      console.log("Logged in successfully!");
      // Redirect to a protected route or update the UI
    }
  } catch (error) {
    console.error(error);
  }
});
