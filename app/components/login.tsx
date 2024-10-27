'use client'

const Login = () => {

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const handle = formData.get('handle')?.toString()

    try {
      const response = await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({ handle }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Login error:', result.error);
      } else {
        const { redirectUrl } = await response.json();
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <>
      <div id="header">
        <h1>Statusphere</h1>
        <p>Set your status on the Atmosphere.</p>
      </div>
      <div className="container">
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            name="handle"
            placeholder="Enter your handle (e.g., alice.bsky.social)"
            required
          />
          <button type="submit">Log in</button>
        </form>
      </div>
    </>
  );
}

export default Login
