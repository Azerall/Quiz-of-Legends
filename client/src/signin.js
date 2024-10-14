import { useState } from 'react';
import './index.css';
import logo from './logo.png';
import axios from 'axios';


// Signin est la page d'inscription de l'application
function Signin (props) {

  const [pseudo, setPseudo] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [pass2, setPass2] = useState(""); 

  const regexLogin = /^[a-z\d_\.]{3,16}$/; // Regex pour l'identifiant : on accepte seulement les lettres minuscules, les chiffres, les points et les underscores

  const [filled, setFilled] = useState(true); // Vérifie si les champs sont remplis
  const [exist, setExist] = useState(true); // Vérifie si le nom d'utilisateur existe déjà
  const [loginLength, setLoginLength] = useState(true); // Vérifie la longueur de l'identifiant
  const [isValidLogin, setIsValidLogin] = useState(true); // Vérifie la validité de l'identifiant
  const [passOK, setPassOK] = useState(true); // Vérifie si les mots de passe sont identiques
  const [passwordLength, setPasswordLength] = useState(true); // Vérifie la longueur du mot de passe

  const getPseudo = (evt) => {setPseudo(evt.target.value)};
  const getLogin = (evt) => {setLogin(evt.target.value)};
  const getPassword = (evt) => {setPassword(evt.target.value)};
  const getPass2 = (evt) => {setPass2(evt.target.value)};

  // Fonction pour inscrire un utilisateur
  const submissionHandler = (evt) => {
    evt.preventDefault();
    setFilled(true);
    setLoginLength(true);
    setIsValidLogin(true);
    setPasswordLength(true);
    setPassOK(true);
    setExist(true);

    if (pseudo.trim() === '' || login.trim() === '' || password.trim() === '' || pass2.trim() === '') { // Les champs ne sont pas remplis
      setFilled(false);
    } else if (login.length < 3 || login.length > 16) { // Identifiant trop court ou trop long
      setLoginLength(false);
    } else if (!regexLogin.test(login)) { // Identifiant non valide
      setIsValidLogin(false);
    } else if (password.length < 6) { // Mot de passe trop court
      setPasswordLength(false);
    } else if (password != pass2){ // Les mots de passe ne sont pas identiques
      setPassOK(false);
    } else {
      axios.put(`${process.env.REACT_APP_API_URL}/api/user/createUser`, { pseudo, username:login, password, headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => { 
        console.log("Utilisateur inscrit");
        console.log(res.data);
        props.changePage("loginPage");
      })
      .catch((error) => {
        if (error.response.status === 409) { // Utilisateur déjà existant
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
        <div className="soustitre"><h2>Inscription</h2></div>
        <form onSubmit={submissionHandler}>
            <div className="inputBox">
                <input id="pseudo" type="text" name="Pseudo" placeholder="Pseudo" onChange={getPseudo}/>
                <input id="login" type="text" name="Username" placeholder="Nom d'utilisateur" onChange={getLogin}/>
                <input id="signin_mdp1" type="password" name="Password" placeholder="Mot de passe" onChange={getPassword}/>
                <input id="signin_mdp2" type="password" name="Password" placeholder="Confirmation du mot de passe" onChange={getPass2}/>
            </div>
            <input type="submit" name="" value="S'inscrire"/>
        </form>

        <div className="text-center" onClick={() => props.changePage("loginPage")}>
          <a>Déjà inscrit ?</a>
        </div>

        <div className="errorBox"></div>
          {filled ? <p></p> : <p>Veuillez remplir tous les champs</p>}
          {loginLength ? <p></p> : <p>Votre identifiant doit faire au moins 3 caractères et maximum 16 caractères</p>}
          {isValidLogin ? <p></p> : <p>Identifiant non accepté</p>}
          {passwordLength ? <p></p> : <p>Erreur : Votre mot de passe doit faire au moins 6 caractères</p>}
          {passOK ? <p></p> : <p>Mots de passe différents</p>}
          {exist ? <p></p> : <p>Utilisateur déjà existant</p>}
        </div>
      </div>
  );
}

export default Signin;
