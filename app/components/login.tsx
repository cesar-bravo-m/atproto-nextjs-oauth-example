'use client'

const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  input: {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: '1rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#4CAF50',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      background: '#45a049',
    }
  }
}

const Login = () => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const handle = formData.get('handle')?.toString()

    try {
      const response = await fetch('/oauth/login', {
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>OAuth Example</h1>
        <p style={styles.subtitle}>Log in with your Bluesky handle.</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          name="handle"
          placeholder="Enter your handle (e.g., alice.bsky.social)"
          required
        />
        <button 
          type="submit" 
          style={styles.button}
          onMouseOver={e => {
            (e.target as HTMLButtonElement).style.background = '#45a049'
          }}
          onMouseOut={e => {
            (e.target as HTMLButtonElement).style.background = '#4CAF50'
          }}
        >
          Log in
        </button>
      </form>
    </div>
  );
}

export default Login
