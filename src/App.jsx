import React, { useState } from 'react'
import authService from './services/authService';

const App = () => {
  const [formData, setFormData] = useState({
    email:"",
    password: "",
    fullName: "NSK Admin",
  })
  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log(formData)

    
    authService.createNewAdmin(formData).then((data) => {
      
      console.log(data)
    });
  }
  return (
    <div>
      <h2>Sign Up form: Admin</h2>
      <form onSubmit={handleSubmit}>
        {/* fullname */}
        <input 
          type="text" 
          placeholder='Full Name' 
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        />
        {/* email */}
        <input 
          type="email" 
          placeholder='Email' 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" 
          placeholder='Password' 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default App