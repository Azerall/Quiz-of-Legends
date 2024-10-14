import { useState } from 'react';
import './index.css';
import logo from './logo.png';
import axios from 'axios';


// Login est la page de connexion de l'application
function Login(props) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const getUsername = (evt) => {setUsername(evt.target.value)}
    const getPassword = (evt) => {setPassword(evt.target.value)}

    const [filled, setFilled] = useState(true); // Vérifie si les champs sont remplis
    const [exist, setExist] = useState(true); // Vérifie la validité du nom d'utilisateur et du mot de passe
    
    // Fonction pour connecter un utilisateur
    const submissionHandler = (evt) => {
      evt.preventDefault();
      setFilled(true);
      setExist(true);

      if (username.trim() === '' || password.trim() === '') { // Les champs ne sont pas remplis
        setFilled(false);
      } else {
        axios.post(`${process.env.REACT_APP_API_URL}/api/user/login`, {username, password}, {
          headers: {
            'Content-Type': 'application/json'
          },
        })
        .then(res => { 
          if(res.status === 200) {
            console.log("Utilisateur connecté :", res.data);
            localStorage.setItem("authToken", res.data.token);
            props.login();
          } 
        })
        .catch((error) => {
          if (error.response.status === 401) { // Mauvais utilisateur ou mot de passe
            setExist(false);
          } else {
            console.log("Erreur interne");
          }
        })
      }
    }

    return (
      <div>

        <header>
          <div className="entetesite">
              <div className="titre">Quiz of Legends</div>
          </div>
        </header>

        <div className="loginBox">
          <div id ="logo">
            <img srcSet={logo} alt="Main Logo"/>
          </div>
          <div className="soustitre"><h2>Connexion</h2></div>
          <form onSubmit={submissionHandler}>
              <div className="inputBox">
                  <input id="username" type="text" name="Username" placeholder="Nom d'utilisateur" onChange={getUsername}/>
                  <input id="pass" type="password" name="Password" placeholder="Mot de passe" onChange={getPassword}/>
              </div>
              <input type="submit" name="" value="Se connecter"/>
          </form>

          <div className="text-center" onClick={() => props.changePage("signinPage")}>
            <a>Pas de compte ?</a>
          </div>

          <div className="errorBox">
            {filled ? null : <p>Veuillez remplir tous les champs</p>}
            {exist ? null : <p>Utilisateur ou mot de passe invalide</p>}
          </div>
          
        </div>
      </div>
    );
}

export default Login;
