'use client'

const Logout = () => {
  const handleLogout = async () => {
    const response = await fetch('/oauth/logout')
    if (response.ok) {
      window.location.href = '/'
    }
  }

  return (
    <button onClick={handleLogout} className="logout-button">
      Log out
    </button>
  )
}

export default Logout

